import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Ensure roles exist
  const roles: RoleName[] = ["ADMIN", "APPROVER", "CONTRIBUTOR", "READER"];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
          passwordHash,
          roles: {
            create: [
              { role: { connect: { name: "ADMIN" } } },
              { role: { connect: { name: "APPROVER" } } },
              { role: { connect: { name: "CONTRIBUTOR" } } },
              { role: { connect: { name: "READER" } } },
            ],
          },
        },
      });

      await prisma.auditEvent.create({
        data: {
          action: "BOOTSTRAP_ADMIN_CREATED",
          entityType: "User",
          entityId: user.id,
          meta: { email: adminEmail },
          actorId: user.id,
        },
      });

      // Create a starter space
      const starterSpace = await prisma.space.create({
        data: {
          name: "Runbooks",
          slug: "runbooks",
          description: "Starter space for operational runbooks",
          createdById: user.id,
        },
      });

      await prisma.collection.create({
        data: {
          name: "Templates",
          slug: "templates",
          description: "Starter templates and examples",
          spaceId: starterSpace.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
