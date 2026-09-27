import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireAdminApiKey } from "../../../../lib/admin";

const createSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]).default("STAFF"),
});

export async function GET(req: Request) {
  try {
    requireAdminApiKey(req);
    const organizationId = new URL(req.url).searchParams.get("organizationId");
    if (!organizationId) return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    const users = await prisma.user.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, select: { id: true, organizationId: true, name: true, email: true, role: true, active: true, createdAt: true, updatedAt: true } });
    return NextResponse.json({ users });
  } catch (e) {
    if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    requireAdminApiKey(req);
    const input = createSchema.parse(await req.json());
    const email = input.email.trim().toLowerCase();
    const org = await prisma.organization.findUnique({ where: { id: input.organizationId } });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { organizationId: input.organizationId, name: input.name, email, passwordHash, role: input.role } });
    return NextResponse.json({ user: { id: user.id, organizationId: user.organizationId, name: user.name, email: user.email, role: user.role, active: user.active } }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message || "Invalid request" }, { status: 400 });
    console.error(e); return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
