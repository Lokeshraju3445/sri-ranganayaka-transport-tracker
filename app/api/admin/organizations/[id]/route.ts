import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../../lib/admin";

const patchSchema = z.object({ name: z.string().trim().min(2).max(150).optional(), active: z.boolean().optional() });
const confirmSchema = z.object({ confirmName: z.string().trim().min(2).optional() }).optional();

function unauthorized(e: unknown) { return e instanceof Error && e.message === "ADMIN_UNAUTHORIZED"; }

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(_);
    const rows = await prisma.$queryRaw<Array<any>>`
      SELECT o."id", o."name", o."active", o."createdAt", o."updatedAt",
        (SELECT COUNT(*)::int FROM "User" u WHERE u."organizationId" = o."id") AS "userCount",
        (SELECT COUNT(*)::int FROM "Vehicle" v WHERE v."organizationId" = o."id") AS "vehicleCount",
        (SELECT COUNT(*)::int FROM "Driver" d WHERE d."organizationId" = o."id") AS "driverCount",
        (SELECT COUNT(*)::int FROM "Customer" c WHERE c."organizationId" = o."id") AS "customerCount",
        (SELECT COUNT(*)::int FROM "Load" l WHERE l."organizationId" = o."id") AS "loadCount"
      FROM "Organization" o WHERE o."id" = ${params.id} LIMIT 1
    `;
    if (!rows[0]) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    return NextResponse.json({ organization: rows[0] });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const input = patchSchema.parse(await req.json());
    const existing = await prisma.organization.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (input.name !== undefined) await prisma.$executeRaw`UPDATE "Organization" SET "name"=${input.name}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${params.id}`;
    if (input.active !== undefined) {
      await prisma.$executeRaw`UPDATE "Organization" SET "active"=${input.active}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${params.id}`;
    }
    const organization = await prisma.$queryRaw<Array<any>>`SELECT "id","name","active","createdAt","updatedAt" FROM "Organization" WHERE "id"=${params.id} LIMIT 1`;
    return NextResponse.json({ organization: organization[0] });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 });
    console.error(e); return NextResponse.json({ error: "Unable to update organization" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const existing = await prisma.organization.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    let body: unknown = undefined;
    try { body = await req.json(); } catch {}
    const parsed = confirmSchema.safeParse(body);
    if (existing.name !== (parsed.data?.confirmName || "")) {
      return NextResponse.json({ error: "Destructive operation requires confirmName matching the organization name" }, { status: 400 });
    }
    await prisma.$executeRaw`UPDATE "Organization" SET "active"=false,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${params.id}`;
    return NextResponse.json({ ok: true, deleted: true, softDeleted: true, organizationId: params.id });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Unable to delete organization" }, { status: 500 });
  }
}
