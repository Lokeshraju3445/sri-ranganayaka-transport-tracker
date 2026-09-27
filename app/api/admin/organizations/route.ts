import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../lib/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(150),
  ownerName: z.string().trim().min(2).max(100),
  ownerEmail: z.string().email().max(200),
  ownerPassword: z.string().min(8).max(100),
});

export async function GET(req: Request) {
  try {
    requireAdminApiKey(req);
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true, vehicles: true, drivers: true, customers: true, loads: true } } },
    });
    return NextResponse.json({ organizations });
  } catch (e) {
    if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    requireAdminApiKey(req);
    const input = schema.parse(await req.json());
    const email = input.ownerEmail.trim().toLowerCase();
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return NextResponse.json({ error: "Owner email already exists" }, { status: 409 });
    const passwordHash = await bcrypt.hash(input.ownerPassword, 12);
    const result = await prisma.$transaction(async tx => {
      const organization = await tx.organization.create({ data: { name: input.name } });
      const owner = await tx.user.create({ data: { organizationId: organization.id, name: input.ownerName, email, passwordHash, role: "OWNER" } });
      return { organization, owner };
    });
    return NextResponse.json({ organization: result.organization, owner: { id: result.owner.id, name: result.owner.name, email: result.owner.email, role: result.owner.role, active: result.owner.active } }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 });
    console.error(e); return NextResponse.json({ error: "Unable to create organization" }, { status: 500 });
  }
}
