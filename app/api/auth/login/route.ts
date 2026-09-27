import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createSession } from "../../../../lib/auth";
const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const user = await prisma.user.findFirst({ where: { email: input.email.trim().toLowerCase(), active: true } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    await createSession({ userId: user.id, organizationId: user.organizationId, role: user.role });
    const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, business: org?.name });
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
}
