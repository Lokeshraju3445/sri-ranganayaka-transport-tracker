import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { id: s.userId, organizationId: s.organizationId, active: true }, select: { id:true,name:true,email:true,role:true,organizationId:true,organization:{select:{name:true}} } });
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}
