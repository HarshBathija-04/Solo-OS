import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";
import { db } from "../db/supabase.js";

declare module "express-serve-static-core" {
  interface Request {
    userId: string;
  }
}

const jwks = createRemoteJWKSet(
  new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

/**
 * Verify the Supabase Auth access token from `Authorization: Bearer <jwt>`.
 * Primary path: local JWKS verification (requires asymmetric JWT signing keys
 * enabled in the Supabase dashboard). Fallback: auth.getUser network check,
 * which also covers legacy HS256-signed tokens.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: "missing_token" });
  }

  try {
    const { payload } = await jwtVerify(token, jwks);
    if (!payload.sub) throw new Error("no sub");
    req.userId = payload.sub;
    return next();
  } catch {
    // Fallback for HS256 (legacy secret) tokens — one network hop.
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ ok: false, error: "invalid_token" });
    }
    req.userId = data.user.id;
    return next();
  }
}
