import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireRole, AuthedRequest } from "../auth/middleware";
import { UpdateUserRolesSchema } from "../validators";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["ADMIN"]));

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { roles: { include: { role: true } } },
  });

  res.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      roles: u.roles.map((ur) => ur.role.name),
    })),
  });
});

adminRouter.patch("/users/:id/roles", async (req: AuthedRequest, res) => {
  const parsed = UpdateUserRolesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const userId = req.params.id;
  const roles = parsed.data.roles;

  // Ensure roles exist
  for (const r of roles) {
    await prisma.role.upsert({ where: { name: r }, update: {}, create: { name: r } });
  }

  // Reset roles
  await prisma.userRole.deleteMany({ where: { userId } });

  // Re-assign roles
  for (const r of roles) {
    await prisma.userRole.create({
      data: {
        userId,
        role: { connect: { name: r } },
      },
    });
  }

  await prisma.auditEvent.create({
    data: {
      action: "ADMIN_UPDATE_USER_ROLES",
      entityType: "User",
      entityId: userId,
      meta: { roles },
      actorId: req.user!.id,
    },
  });

  res.json({ ok: true });
});
