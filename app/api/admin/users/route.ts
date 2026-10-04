import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../lib/admin";

const createSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).default("STAFF"),
});

export async function GET(req: Request) {
  try {
    requireAdminApiKey(req);
    const organizationId = new URL(req.url).searchParams.get("organizationId");
    if (!organizationId) return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    const users = await prisma.$queryRaw<Array<any>>`
      SELECT u."id",u."organizationId" AS "primaryOrganizationId",u."name",u."email",u."active" AS "userActive",u."createdAt",u."updatedAt",
             m."id" AS "membershipId",m."role"::text AS "role",m."active" AS "accessActive",m."createdAt" AS "accessCreatedAt",m."updatedAt" AS "accessUpdatedAt"
      FROM "OrganizationMembership" m JOIN "User" u ON u."id"=m."userId"
      WHERE m."organizationId"=${organizationId}
      ORDER BY u."createdAt" DESC`;
    return NextResponse.json({ users });
  } catch (e) {
    if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    requireAdminApiKey(req);
    const input = createSchema.parse(await req.json());
    const email = input.email.trim().toLowerCase();
    const orgRows = await prisma.$queryRaw<Array<{id:string;active:boolean}>>`SELECT "id","active" FROM "Organization" WHERE "id"=${input.organizationId} LIMIT 1`;
    if (!orgRows[0]) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (!orgRows[0].active) return NextResponse.json({ error: "Organization is inactive" }, { status: 409 });
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already exists. Use the organization access API to grant another organization to an existing user." }, { status: 409 });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.$transaction(async tx => {
      const created = await tx.user.create({ data: { organizationId: input.organizationId, name: input.name, email, passwordHash, role: input.role } });
      await tx.$executeRaw`INSERT INTO "OrganizationMembership" ("id","userId","organizationId","role","active","createdAt","updatedAt") VALUES (${randomUUID()},${created.id},${input.organizationId},${input.role}::"UserRole",true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
      return created;
    });
    return NextResponse.json({ user: { id: user.id, organizationId: user.organizationId, name: user.name, email: user.email, role: user.role, active: user.active } }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 });
    console.error(e); return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
