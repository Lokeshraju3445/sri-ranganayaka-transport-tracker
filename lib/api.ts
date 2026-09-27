import { NextResponse } from "next/server";
import { z } from "zod";
export function jsonError(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
export function handleError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
  if (error instanceof z.ZodError) return jsonError(error.issues[0]?.message || "Invalid request", 400);
  if (typeof error === "object" && error && "code" in error && (error as any).code === "P2002") return jsonError("A record with the same unique value already exists", 409);
  console.error(error);
  return jsonError("Internal server error", 500);
}
export function asNumber(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${field}`);
  return n;
}
