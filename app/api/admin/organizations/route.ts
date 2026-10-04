import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../lib/admin";

const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  ownerName: z.string().trim().min(2).max(100),
  ownerEmail: z.string().email().max(200),
  ownerPassword: z.string().min(8).max(100),
});

function unauthorized(e: unknown) { return e instanceof Error && e.message === "ADMIN_UNAUTHORIZED"; }

export async function GET(req: Request) {
  try {
    requireAdminApiKey(req);
    const includeInactive = new URL(req.url).searchParams.get("includeInactive") === "true";
    const organizations = includeInactive
      ? await prisma.$queryRaw<Array<any>>`
          SELECT o."id", o."name", o."active", o."createdAt", o."updatedAt",
                 (SELECT COUNT(*)::int FROM "User" u WHERE u."organizationId" = o."id") AS "userCount",
                 (SELECT COUNT(*)::int FROM "Vehicle" v WHERE v."organizationId" = o."id") AS "vehicleCount",
                 (SELECT COUNT(*)::int FROM "Driver" d WHERE d."organizationId" = o."id") AS "driverCount",
                 (SELECT COUNT(*)::int FROM "Customer" c WHERE c."organizationId" = o."id") AS "customerCount",
                 (SELECT COUNT(*)::int FROM "Load" l WHERE l."organizationId" = o."id") AS "loadCount"
          FROM "Organization" o ORDER BY o."createdAt" DESC
        `
      : await prisma.$queryRaw<Array<any>>`
          SELECT o."id", o."name", o."active", o."createdAt", o."updatedAt",
                 (SELECT COUNT(*)::int FROM "User" u WHERE u."organizationId" = o."id") AS "userCount",
                 (SELECT COUNT(*)::int FROM "Vehicle" v WHERE v."organizationId" = o."id") AS "vehicleCount",
                 (SELECT COUNT(*)::int FROM "Driver" d WHERE d."organizationId" = o."id") AS "driverCount",
                 (SELECT COUNT(*)::int FROM "Customer" c WHERE c."organizationId" = o."id") AS "customerCount",
                 (SELECT COUNT(*)::int FROM "Load" l WHERE l."organizationId" = o."id") AS "loadCount"
          FROM "Organization" o WHERE o."active" = true ORDER BY o."createdAt" DESC
        `;
    return NextResponse.json({ organizations });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    requireAdminApiKey(req);
    const input = createSchema.parse(await req.json());
    const email = input.ownerEmail.trim().toLowerCase();
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return NextResponse.json({ error: "Owner email already exists" }, { status: 409 });
    const passwordHash = await bcrypt.hash(input.ownerPassword, 12);
    const result = await prisma.$transaction(async tx => {
      const organization = await tx.organization.create({ data: { name: input.name } });
      const owner = await tx.user.create({ data: { organizationId: organization.id, name: input.ownerName, email, passwordHash, role: "OWNER" } });
      await tx.$executeRaw`INSERT INTO "OrganizationMembership" ("id","userId","organizationId","role","active","createdAt","updatedAt") VALUES (${randomUUID()},${owner.id},${organization.id},'OWNER'::"UserRole",true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
      return { organization, owner };
    });
    return NextResponse.json({ organization: result.organization, owner: { id: result.owner.id, name: result.owner.name, email: result.owner.email, role: result.owner.role, active: result.owner.active } }, { status: 201 });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 });
    console.error(e); return NextResponse.json({ error: "Unable to create organization" }, { status: 500 });
  }
}
