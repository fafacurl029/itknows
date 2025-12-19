import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireRole, AuthedRequest } from "../auth/middleware";
import { slugify } from "../utils/slug";
import { SpaceSchema, CollectionSchema, ArticleCreateSchema, ArticleUpdateSchema, CommentSchema } from "../validators";

export const contentRouter = Router();

contentRouter.get("/spaces", requireAuth, async (_req, res) => {
  const spaces = await prisma.space.findMany({
    orderBy: { name: "asc" },
    include: { collections: { orderBy: { name: "asc" } } },
  });
  res.json({ spaces });
});

contentRouter.post("/spaces", requireAuth, requireRole(["ADMIN", "CONTRIBUTOR", "APPROVER"]), async (req: AuthedRequest, res) => {
  const parsed = SpaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const slug = slugify(parsed.data.name);
  const space = await prisma.space.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      createdById: req.user!.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      action: "SPACE_CREATE",
      entityType: "Space",
      entityId: space.id,
      meta: { name: space.name, slug: space.slug },
      actorId: req.user!.id,
    },
  });

  res.json({ space });
});

contentRouter.post("/collections", requireAuth, requireRole(["ADMIN", "CONTRIBUTOR", "APPROVER"]), async (req: AuthedRequest, res) => {
  const parsed = CollectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const slug = slugify(parsed.data.name);
  const col = await prisma.collection.create({
    data: {
      spaceId: parsed.data.spaceId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
    },
  });

  await prisma.auditEvent.create({
    data: {
      action: "COLLECTION_CREATE",
      entityType: "Collection",
      entityId: col.id,
      meta: { name: col.name, slug: col.slug, spaceId: col.spaceId },
      actorId: req.user!.id,
    },
  });

  res.json({ collection: col });
});

contentRouter.get("/articles", requireAuth, async (req, res) => {
  const spaceId = String(req.query.spaceId || "");
  const collectionId = String(req.query.collectionId || "");
  const status = String(req.query.status || "");
  const q = String(req.query.q || "");

  const where: any = {};
  if (spaceId) where.spaceId = spaceId;
  if (collectionId) where.collectionId = collectionId;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const articles = await prisma.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      createdBy: { select: { id: true, email: true, name: true } },
      updatedBy: { select: { id: true, email: true, name: true } },
      collection: true,
      space: true,
    },
    take: 200,
  });

  res.json({
    articles: articles.map((a) => ({
      ...a,
      tags: a.tags.map((t) => t.tag.name),
    })),
  });
});

contentRouter.get("/articles/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      comments: { orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, email: true, name: true } } } },
      versions: { orderBy: { versionNumber: "desc" }, take: 20, include: { createdBy: { select: { id: true, email: true, name: true } } } },
      space: true,
      collection: true,
      createdBy: { select: { id: true, email: true, name: true } },
      updatedBy: { select: { id: true, email: true, name: true } },
    },
  });
  if (!article) return res.status(404).json({ error: "Not found" });

  res.json({
    article: {
      ...article,
      tags: article.tags.map((t) => t.tag.name),
    },
  });
});

contentRouter.post("/articles", requireAuth, requireRole(["ADMIN", "CONTRIBUTOR", "APPROVER"]), async (req: AuthedRequest, res) => {
  const parsed = ArticleCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const slug = slugify(parsed.data.title);

  const article = await prisma.article.create({
    data: {
      spaceId: parsed.data.spaceId,
      collectionId: parsed.data.collectionId ?? null,
      title: parsed.data.title,
      slug,
      type: parsed.data.type as any,
      content: parsed.data.content || "",
      ownerId: parsed.data.ownerId ?? null,
      createdById: req.user!.id,
      updatedById: req.user!.id,
    },
  });

  await prisma.articleVersion.create({
    data: {
      articleId: article.id,
      versionNumber: 1,
      title: article.title,
      content: article.content,
      changeSummary: "Initial version",
      createdById: req.user!.id,
    },
  });

  if (parsed.data.tags?.length) {
    await upsertTags(article.id, parsed.data.tags);
  }

  await prisma.auditEvent.create({
    data: {
      action: "ARTICLE_CREATE",
      entityType: "Article",
      entityId: article.id,
      meta: { title: article.title, type: article.type, spaceId: article.spaceId },
      actorId: req.user!.id,
    },
  });

  res.json({ article });
});

contentRouter.patch("/articles/:id", requireAuth, requireRole(["ADMIN", "CONTRIBUTOR", "APPROVER"]), async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const parsed = ArticleUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  // Only approver/admin can publish or deprecate
  const wantsStatus = parsed.data.status;
  if (wantsStatus && (wantsStatus === "PUBLISHED" || wantsStatus === "DEPRECATED")) {
    const roles = req.user!.roles;
    const ok = roles.includes("ADMIN") || roles.includes("APPROVER");
    if (!ok) return res.status(403).json({ error: "Requires APPROVER or ADMIN to publish/deprecate." });
  }

  const nextTitle = parsed.data.title ?? existing.title;
  const nextContent = parsed.data.content ?? existing.content;

  // Create new version
  const last = await prisma.articleVersion.findFirst({
    where: { articleId: id },
    orderBy: { versionNumber: "desc" },
  });
  const nextVersion = (last?.versionNumber || 0) + 1;

  await prisma.articleVersion.create({
    data: {
      articleId: id,
      versionNumber: nextVersion,
      title: nextTitle,
      content: nextContent,
      changeSummary: parsed.data.changeSummary ?? null,
      createdById: req.user!.id,
    },
  });

  // Update article
  const updated = await prisma.article.update({
    where: { id },
    data: {
      title: parsed.data.title ?? undefined,
      content: parsed.data.content ?? undefined,
      ownerId: parsed.data.ownerId ?? undefined,
      lastVerifiedAt: parsed.data.lastVerifiedAt ? new Date(parsed.data.lastVerifiedAt) : undefined,
      status: parsed.data.status as any ?? undefined,
      updatedById: req.user!.id,
      slug: parsed.data.title ? slugify(parsed.data.title) : undefined,
    },
  });

  if (parsed.data.tags) {
    await replaceTags(id, parsed.data.tags);
  }

  await prisma.auditEvent.create({
    data: {
      action: "ARTICLE_UPDATE",
      entityType: "Article",
      entityId: id,
      meta: { version: nextVersion, status: updated.status },
      actorId: req.user!.id,
    },
  });

  res.json({ article: updated });
});

contentRouter.post("/articles/:id/restore/:versionNumber", requireAuth, requireRole(["ADMIN", "APPROVER"]), async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const versionNumber = Number(req.params.versionNumber);

  const v = await prisma.articleVersion.findUnique({
    where: { articleId_versionNumber: { articleId: id, versionNumber } },
  });
  if (!v) return res.status(404).json({ error: "Version not found" });

  const restored = await prisma.article.update({
    where: { id },
    data: {
      title: v.title,
      content: v.content,
      updatedById: req.user!.id,
      slug: slugify(v.title),
    },
  });

  const last = await prisma.articleVersion.findFirst({
    where: { articleId: id },
    orderBy: { versionNumber: "desc" },
  });
  const nextVersion = (last?.versionNumber || 0) + 1;

  await prisma.articleVersion.create({
    data: {
      articleId: id,
      versionNumber: nextVersion,
      title: restored.title,
      content: restored.content,
      changeSummary: `Restore from v${versionNumber}`,
      createdById: req.user!.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      action: "ARTICLE_RESTORE_VERSION",
      entityType: "Article",
      entityId: id,
      meta: { restoredFrom: versionNumber, newVersion: nextVersion },
      actorId: req.user!.id,
    },
  });

  res.json({ article: restored });
});

contentRouter.post("/articles/:id/comments", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = CommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const articleId = req.params.id;
  const comment = await prisma.comment.create({
    data: {
      articleId,
      userId: req.user!.id,
      body: parsed.data.body,
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  await prisma.auditEvent.create({
    data: {
      action: "COMMENT_CREATE",
      entityType: "Article",
      entityId: articleId,
      meta: { commentId: comment.id },
      actorId: req.user!.id,
    },
  });

  res.json({ comment });
});

contentRouter.get("/audit", requireAuth, async (_req, res) => {
  const events = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { id: true, email: true, name: true } } },
  });
  res.json({ events });
});

async function upsertTags(articleId: string, tags: string[]) {
  for (const t of tags) {
    const name = t.trim().toLowerCase();
    if (!name) continue;
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId, tagId: tag.id } },
      update: {},
      create: { articleId, tagId: tag.id },
    });
  }
}

async function replaceTags(articleId: string, tags: string[]) {
  await prisma.articleTag.deleteMany({ where: { articleId } });
  await upsertTags(articleId, tags);
}
