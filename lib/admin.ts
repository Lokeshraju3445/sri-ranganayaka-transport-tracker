import { timingSafeEqual } from "node:crypto";

export function requireAdminApiKey(req: Request) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured || configured.length < 32) throw new Error("ADMIN_API_KEY is not configured correctly");
  const auth = req.headers.get("authorization") || "";
  const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers.get("x-admin-api-key") || "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(configured);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("ADMIN_UNAUTHORIZED");
}

