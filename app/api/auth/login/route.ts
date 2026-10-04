import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createSession } from "../../../../lib/auth";
const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const user = await prisma.user.findFirst({ where: { email: input.email.trim().toLowerCase(), active: true } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    const memberships = await prisma.$queryRaw<Array<{organizationId:string;role:"OWNER"|"MANAGER"|"STAFF";organizationName:string}>>`
      SELECT m."organizationId", m."role"::text AS "role", o."name" AS "organizationName"
      FROM "OrganizationMembership" m JOIN "Organization" o ON o."id"=m."organizationId"
      WHERE m."userId"=${user.id} AND m."active"=true AND o."active"=true
      ORDER BY CASE WHEN m."organizationId"=${user.organizationId} THEN 0 ELSE 1 END, o."name" ASC
    `;
    if (!memberships[0]) return NextResponse.json({ error: "No active organization access" }, { status: 403 });
    const current = memberships[0];
    await createSession({ userId:user.id, organizationId:current.organizationId, role:current.role });
    return NextResponse.json({ user: { id:user.id,name:user.name,email:user.email,role:current.role,organizationId:current.organizationId }, business:current.organizationName, organizations:memberships });
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
}
