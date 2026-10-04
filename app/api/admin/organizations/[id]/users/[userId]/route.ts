import { NextResponse } from "next/server";
import { requireAdminApiKey } from "../../../../../../../lib/admin";
import { prisma } from "../../../../../../../lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    requireAdminApiKey(req);
    const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { id:true,organizationId:true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const membership = await prisma.$queryRaw<Array<{id:string;active:boolean}>>`SELECT "id","active" FROM "OrganizationMembership" WHERE "userId"=${params.userId} AND "organizationId"=${params.id} LIMIT 1`;
    if (!membership[0]) return NextResponse.json({ error: "User does not have access to this organization" }, { status: 404 });
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`UPDATE "OrganizationMembership" SET "active"=false,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=${params.userId} AND "organizationId"=${params.id}`;
      if (user.organizationId === params.id) {
        const next = await tx.$queryRaw<Array<{organizationId:string;role:"OWNER"|"MANAGER"|"STAFF"}>>`SELECT "organizationId","role"::text AS "role" FROM "OrganizationMembership" WHERE "userId"=${params.userId} AND "active"=true ORDER BY "createdAt" ASC LIMIT 1`;
        if (next[0]) await tx.user.update({ where:{id:params.userId}, data:{organizationId:next[0].organizationId, role:next[0].role} });
        else await tx.user.update({ where:{id:params.userId}, data:{active:false} });
      }
    });
    return NextResponse.json({ ok:true, revoked:true, organizationId:params.id, userId:params.userId });
  } catch (e) { if(e instanceof Error && e.message==='ADMIN_UNAUTHORIZED') return NextResponse.json({error:'Unauthorized'},{status:401}); console.error(e); return NextResponse.json({error:'Unable to revoke organization user access'},{status:500}); }
}
