import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../../../lib/admin";
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try { requireAdminApiKey(req); const org = await prisma.organization.findUnique({ where: { id: params.id } }); if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 }); await prisma.$executeRaw`UPDATE "Organization" SET "active"=true,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${params.id}`; return NextResponse.json({ ok: true, active: true }); }
  catch (e) { if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); console.error(e); return NextResponse.json({ error: "Unable to activate organization" }, { status: 500 }); }
}
