import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../../lib/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  password: z.string().min(8).max(100).optional(),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).optional(),
  active: z.boolean().optional(),
});

function unauthorized(e: unknown) { return e instanceof Error && e.message === "ADMIN_UNAUTHORIZED"; }

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id:true,organizationId:true,name:true,email:true,role:true,active:true,createdAt:true,updatedAt:true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const organizations = await prisma.$queryRaw<Array<any>>`SELECT m."id",m."organizationId",o."name" AS "organizationName",o."active" AS "organizationActive",m."role"::text AS "role",m."active",m."createdAt",m."updatedAt" FROM "OrganizationMembership" m JOIN "Organization" o ON o."id"=m."organizationId" WHERE m."userId"=${params.id} ORDER BY o."name" ASC`;
    const primary = organizations.find(o => o.organizationId === user.organizationId) || null;
    return NextResponse.json({ user: { ...user, organization: primary ? { id: primary.organizationId, name: primary.organizationName, active: primary.organizationActive } : null }, organizations });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const input = schema.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.role !== undefined) data.role = input.role;
    if (input.active !== undefined) data.active = input.active;
    if (input.password !== undefined) data.passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.update({ where: { id: params.id }, data });
    if (input.role !== undefined) await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "role" = ${input.role}::"UserRole", "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = ${params.id} AND "organizationId" = ${user.organizationId}`;
    if (input.active !== undefined) await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "active" = ${input.active}, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = ${params.id}`;
    return NextResponse.json({ user: { id: user.id, organizationId: user.organizationId, name: user.name, email: user.email, role: user.role, active: user.active } });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 });
    console.error(e); return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await prisma.user.update({ where: { id: params.id }, data: { active: false } });
    await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = ${params.id}`;
    return NextResponse.json({ ok: true, revoked: true, userId: params.id });
  } catch (e) {
    if (unauthorized(e)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Unable to revoke access" }, { status: 500 });
  }
}
