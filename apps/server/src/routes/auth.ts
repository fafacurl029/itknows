import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma";
import { signJwt } from "../auth/jwt";
import { BootstrapSchema, LoginSchema } from "../validators";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
});

authRouter.get("/bootstrap/status", async (_req, res) => {
  const count = await prisma.user.count();
  res.json({ needsSetup: count === 0 });
});

// Create first admin (only if no users exist)
authRouter.post("/bootstrap", authLimiter, async (req, res) => {
  const parsed = BootstrapSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const count = await prisma.user.count();
  if (count > 0) return res.status(403).json({ error: "Bootstrap already completed." });

  const { email, password, name } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  // Ensure roles
  const roles = ["ADMIN", "APPROVER", "CONTRIBUTOR", "READER"] as const;
  for (const r of roles) {
    await prisma.role.upsert({ where: { name: r }, update: {}, create: { name: r } });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: name || "Admin",
      passwordHash,
      roles: {
        create: roles.map((r) => ({ role: { connect: { name: r } } })),
      },
    },
    include: { roles: { include: { role: true } } },
  });

  await prisma.auditEvent.create({
    data: {
      action: "BOOTSTRAP_ADMIN_CREATED",
      entityType: "User",
      entityId: user.id,
      meta: { email },
      actorId: user.id,
    },
  });

  // starter space
  const space = await prisma.space.create({
    data: {
      name: "Runbooks",
      slug: "runbooks",
      description: "Operational runbooks and SOPs",
      createdById: user.id,
    },
  });

  await prisma.collection.create({
    data: {
      name: "Templates",
      slug: "templates",
      description: "Starter templates and examples",
      spaceId: space.id,
    },
  });

  const token = signJwt({
    sub: user.id,
    roles: user.roles.map((ur) => ur.role.name),
  });

  res.cookie("auth", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((ur) => ur.role.name),
    },
  });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signJwt({
    sub: user.id,
    roles: user.roles.map((ur) => ur.role.name),
  });

  res.cookie("auth", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  await prisma.auditEvent.create({
    data: {
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      meta: { email: user.email },
      actorId: user.id,
    },
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((ur) => ur.role.name),
    },
  });
});

authRouter.post("/logout", async (_req, res) => {
  res.clearCookie("auth", { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.auth;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    // avoid importing middleware here to keep it simple
    const { verifyJwt } = await import("../auth/jwt");
    const payload = verifyJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((ur) => ur.role.name),
      },
    });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});
