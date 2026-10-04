import { NextResponse } from "next/server";
import { requireAdminApiKey } from "../../../../../../lib/admin";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const org = await prisma.$queryRaw<Array<{id:string;name:string;active:boolean}>>`SELECT "id","name","active" FROM "Organization" WHERE "id"=${params.id} LIMIT 1`;
    if (!org[0]) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    const users = await prisma.$queryRaw<Array<any>>`
      SELECT u."id",u."organizationId" AS "primaryOrganizationId",u."name",u."email",u."active" AS "userActive",u."createdAt",u."updatedAt",
             m."id" AS "membershipId",m."role"::text AS "role",m."active" AS "accessActive",m."createdAt" AS "accessCreatedAt",m."updatedAt" AS "accessUpdatedAt"
      FROM "OrganizationMembership" m JOIN "User" u ON u."id"=m."userId"
      WHERE m."organizationId"=${params.id}
      ORDER BY u."createdAt" DESC
    `;
    return NextResponse.json({ organization:org[0], users });
  } catch (e) {
    if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
