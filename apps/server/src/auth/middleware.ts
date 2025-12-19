import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./jwt";

export type AuthedRequest = Request & {
  user?: { id: string; roles: string[] };
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.auth;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, roles: payload.roles };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(anyOf: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const ok = req.user.roles.some((r) => anyOf.includes(r));
    if (!ok) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}
