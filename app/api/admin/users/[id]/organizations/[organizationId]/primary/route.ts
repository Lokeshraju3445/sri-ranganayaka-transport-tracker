import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../../../../../lib/admin";
export async function POST(req: Request, { params }: { params:{id:string;organizationId:string} }) {
  try {
    requireAdminApiKey(req);
    const membership = await prisma.$queryRaw<Array<{role:"OWNER"|"MANAGER"|"STAFF";active:boolean}>>`SELECT "role"::text AS "role","active" FROM "OrganizationMembership" WHERE "userId"=${params.id} AND "organizationId"=${params.organizationId} LIMIT 1`;
    if (!membership[0]) return NextResponse.json({error:"Organization access not found"},{status:404});
    if (!membership[0].active) return NextResponse.json({error:"Organization access is inactive"},{status:409});
    const org = await prisma.$queryRaw<Array<{id:string;name:string;active:boolean}>>`SELECT "id","name","active" FROM "Organization" WHERE "id"=${params.organizationId} LIMIT 1`;
    if (!org[0]) return NextResponse.json({error:"Organization not found"},{status:404});
    if (!org[0].active) return NextResponse.json({error:"Organization is inactive"},{status:409});
    await prisma.user.update({where:{id:params.id},data:{organizationId:params.organizationId,role:membership[0].role}});
    return NextResponse.json({ok:true,primaryOrganization:org[0],role:membership[0].role});
  } catch(e){ if(e instanceof Error && e.message==='ADMIN_UNAUTHORIZED') return NextResponse.json({error:'Unauthorized'},{status:401}); console.error(e); return NextResponse.json({error:'Unable to change primary organization'},{status:500}); }
}
