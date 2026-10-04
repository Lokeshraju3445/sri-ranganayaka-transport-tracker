import { NextResponse } from "next/server";
import { requireAdminApiKey } from "../../../../../../lib/admin";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id:true,name:true,email:true,active:true,organizationId:true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const organizations = await prisma.$queryRaw<Array<any>>`SELECT m."id",m."organizationId",o."name" AS "organizationName",o."active" AS "organizationActive",m."role"::text AS "role",m."active",m."createdAt",m."updatedAt" FROM "OrganizationMembership" m JOIN "Organization" o ON o."id"=m."organizationId" WHERE m."userId"=${params.id} ORDER BY o."name" ASC`;
    return NextResponse.json({ user, organizations });
  } catch (e) { if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
