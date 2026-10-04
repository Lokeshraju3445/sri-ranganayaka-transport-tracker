import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../../../lib/admin";
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApiKey(req);
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const active = false;
    await prisma.user.update({ where: { id: params.id }, data: { active } });
    await prisma.$executeRaw`UPDATE "OrganizationMembership" SET "active"=${active},"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=${params.id}`;
    return NextResponse.json({ ok: true, active });
  } catch (e) { if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); console.error(e); return NextResponse.json({ error: "Unable to revoke user" }, { status: 500 }); }
}
