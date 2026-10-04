import { NextResponse } from "next/server";
import { requireSession, createSession } from "../../../../../lib/auth";
import { getMembership } from "../../../../../lib/organization-access";
import { prisma } from "../../../../../lib/prisma";
export async function POST(req: Request, { params }: { params:{organizationId:string} }) {
  try { const s=await requireSession(); const membership=await getMembership(s.userId,params.organizationId); if(!membership || !membership.active) return NextResponse.json({error:'Organization access not found'},{status:403}); const org=await prisma.$queryRaw<Array<{id:string;name:string;active:boolean}>>`SELECT "id","name","active" FROM "Organization" WHERE "id"=${params.organizationId} LIMIT 1`; if(!org[0] || !org[0].active) return NextResponse.json({error:'Organization is inactive'},{status:403}); await createSession({userId:s.userId,organizationId:params.organizationId,role:membership.role}); return NextResponse.json({ok:true,organization:{id:org[0].id,name:org[0].name},role:membership.role}); }
  catch(e){ if(e instanceof Error && e.message==='UNAUTHORIZED') return NextResponse.json({error:'Unauthorized'},{status:401}); console.error(e); return NextResponse.json({error:'Unable to switch organization'},{status:500}); }
}
