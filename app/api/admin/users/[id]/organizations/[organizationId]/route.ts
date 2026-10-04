import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdminApiKey } from "../../../../../../../lib/admin";
import { prisma } from "../../../../../../../lib/prisma";

const schema = z.object({ role: z.enum(["OWNER", "MANAGER", "STAFF"]).default("STAFF"), active: z.boolean().default(true) });
function unauthorized(e: unknown) { return e instanceof Error && e.message === "ADMIN_UNAUTHORIZED"; }

export async function POST(req: Request, { params }: { params: { id: string; organizationId: string } }) {
  try {
    requireAdminApiKey(req);
    const input = schema.parse(await req.json().catch(() => ({})));
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const orgRows = await prisma.$queryRaw<Array<{id:string;active:boolean}>>`SELECT "id","active" FROM "Organization" WHERE "id"=${params.organizationId} LIMIT 1`;
    if (!orgRows[0]) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (!orgRows[0].active) return NextResponse.json({ error: "Organization is inactive" }, { status: 409 });
    await prisma.$executeRaw`
      INSERT INTO "OrganizationMembership" ("id","userId","organizationId","role","active","createdAt","updatedAt")
      VALUES (${randomUUID()},${params.id},${params.organizationId},${input.role}::"UserRole",${input.active},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT ("userId","organizationId") DO UPDATE SET "role"=EXCLUDED."role","active"=EXCLUDED."active","updatedAt"=CURRENT_TIMESTAMP
    `;
    const membership = await prisma.$queryRaw<Array<any>>`SELECT m."id",m."userId",m."organizationId",o."name" AS "organizationName",m."role"::text AS "role",m."active",m."createdAt",m."updatedAt" FROM "OrganizationMembership" m JOIN "Organization" o ON o."id"=m."organizationId" WHERE m."userId"=${params.id} AND m."organizationId"=${params.organizationId} LIMIT 1`;
    return NextResponse.json({ membership: membership[0] });
  } catch (e) { if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 }); console.error(e); return NextResponse.json({ error: "Unable to grant organization access" }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: { id: string; organizationId: string } }) {
  try {
    requireAdminApiKey(req);
    const input = schema.partial().parse(await req.json());
    const existing = await prisma.$queryRaw<Array<any>>`SELECT "id" FROM "OrganizationMembership" WHERE "userId"=${params.id} AND "organizationId"=${params.organizationId} LIMIT 1`;
    if (!existing[0]) return NextResponse.json({ error: "Organization access not found" }, { status: 404 });
    if (input.role !== undefined && input.active !== undefined) await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "role"=${input.role}::"UserRole","active"=${input.active},"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=${params.id} AND "organizationId"=${params.organizationId}`;
    else if (input.role !== undefined) await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "role"=${input.role}::"UserRole","updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=${params.id} AND "organizationId"=${params.organizationId}`;
    else if (input.active !== undefined) await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "active"=${input.active},"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=${params.id} AND "organizationId"=${params.organizationId}`;
    const membership = await prisma.$queryRaw<Array<any>>`SELECT m."id",m."userId",m."organizationId",o."name" AS "organizationName",m."role"::text AS "role",m."active",m."createdAt",m."updatedAt" FROM "OrganizationMembership" m JOIN "Organization" o ON o."id"=m."organizationId" WHERE m."userId"=${params.id} AND m."organizationId"=${params.organizationId} LIMIT 1`;
    return NextResponse.json({ membership: membership[0] });
  } catch (e) { if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 }); console.error(e); return NextResponse.json({ error: "Unable to update organization access" }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: { id: string; organizationId: string } }) {
  try {
    requireAdminApiKey(req);
    const result = await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "active"=false,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=${params.id} AND "organizationId"=${params.organizationId}`;
    if (!result) return NextResponse.json({ error: "Organization access not found" }, { status: 404 });
    return NextResponse.json({ ok: true, revoked: true, userId: params.id, organizationId: params.organizationId });
  } catch (e) { if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); console.error(e); return NextResponse.json({ error: "Unable to revoke organization access" }, { status: 500 }); }
}
