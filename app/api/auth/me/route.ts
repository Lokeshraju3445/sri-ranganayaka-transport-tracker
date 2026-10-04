import { NextResponse } from "next/server";
import { getSession, requireSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  try {
    const current = await requireSession();
    const user = await prisma.user.findFirst({ where: { id: current.userId, active: true }, select: { id:true,name:true,email:true,role:true,organizationId:true } });
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    const org = await prisma.$queryRaw<Array<{id:string;name:string}>>`SELECT "id","name" FROM "Organization" WHERE "id"=${current.organizationId} LIMIT 1`;
    const memberships = await prisma.$queryRaw<Array<{organizationId:string;organizationName:string;role:"OWNER"|"MANAGER"|"STAFF"}>>`SELECT m."organizationId",o."name" AS "organizationName",m."role"::text AS "role" FROM "OrganizationMembership" m JOIN "Organization" o ON o."id"=m."organizationId" WHERE m."userId"=${current.userId} AND m."active"=true AND o."active"=true ORDER BY o."name" ASC`;
    return NextResponse.json({ user: { ...user, organizationId:current.organizationId, role:current.role, organization: org[0] || null }, organizations: memberships });
  } catch { return NextResponse.json({ user:null }, { status:401 }); }
}
