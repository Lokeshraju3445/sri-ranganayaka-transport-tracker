import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const COOKIE = "transport_session";
const rawSecret = process.env.AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!rawSecret || rawSecret.length < 32)) {
  throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters in production");
}
const secret = new TextEncoder().encode(rawSecret || "local-development-secret-change-me-32-characters");

export type Session = { userId: string; organizationId: string; role: "OWNER" | "MANAGER" | "STAFF" };

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId || !payload.organizationId || !payload.role) return null;
    return { userId: String(payload.userId), organizationId: String(payload.organizationId), role: payload.role as Session["role"] };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  const user = await prisma.user.findFirst({ where: { id: session.userId, organizationId: session.organizationId, active: true } });
  if (!user) throw new Error("UNAUTHORIZED");
  return session;
}

export function canWrite(role: Session["role"]) { return role === "OWNER" || role === "MANAGER"; }
export function canManage(role: Session["role"]) { return role === "OWNER"; }
