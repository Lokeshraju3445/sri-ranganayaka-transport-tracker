import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/auth";
import { getActiveMemberships } from "../../../../lib/organization-access";
export async function GET() { try { const s=await requireSession(); const organizations=await getActiveMemberships(s.userId); return NextResponse.json({organizations,currentOrganizationId:s.organizationId}); } catch(e){ if(e instanceof Error && e.message==='UNAUTHORIZED') return NextResponse.json({error:'Unauthorized'},{status:401}); console.error(e); return NextResponse.json({error:'Internal server error'},{status:500}); } }
