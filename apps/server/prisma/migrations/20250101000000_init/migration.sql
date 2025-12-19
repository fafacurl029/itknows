CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enums
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'APPROVER', 'CONTRIBUTOR', 'READER');
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'DEPRECATED');
CREATE TYPE "ArticleType" AS ENUM ('RUNBOOK', 'TROUBLESHOOTING', 'SOP', 'HOW_TO', 'ARCHITECTURE', 'CHANGE_PROCEDURE');

-- Create tables
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Role" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" "RoleName" NOT NULL UNIQUE
);

CREATE TABLE "UserRole" (
  "userId" UUID NOT NULL,
  "roleId" UUID NOT NULL,
  PRIMARY KEY ("userId", "roleId"),
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Space" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdById" UUID NOT NULL,
  CONSTRAINT "Space_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Collection" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "spaceId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Collection_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Collection_spaceId_slug_key" ON "Collection"("spaceId","slug");
CREATE INDEX "Collection_spaceId_idx" ON "Collection"("spaceId");

CREATE TABLE "Article" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "spaceId" UUID NOT NULL,
  "collectionId" UUID,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "ArticleType" NOT NULL,
  "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
  "content" TEXT NOT NULL DEFAULT '',
  "ownerId" UUID,
  "lastVerifiedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdById" UUID NOT NULL,
  "updatedById" UUID,
  CONSTRAINT "Article_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Article_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Article_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Article_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Article_spaceId_slug_key" ON "Article"("spaceId","slug");
CREATE INDEX "Article_spaceId_collectionId_idx" ON "Article"("spaceId","collectionId");
CREATE INDEX "Article_status_idx" ON "Article"("status");

CREATE TABLE "ArticleVersion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "articleId" UUID NOT NULL,
  "versionNumber" INT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "changeSummary" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdById" UUID NOT NULL,
  CONSTRAINT "ArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ArticleVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ArticleVersion_articleId_versionNumber_key" ON "ArticleVersion"("articleId","versionNumber");
CREATE INDEX "ArticleVersion_articleId_idx" ON "ArticleVersion"("articleId");

CREATE TABLE "Tag" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE "ArticleTag" (
  "articleId" UUID NOT NULL,
  "tagId" UUID NOT NULL,
  PRIMARY KEY ("articleId","tagId"),
  CONSTRAINT "ArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ArticleTag_tagId_idx" ON "ArticleTag"("tagId");

CREATE TABLE "Comment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "articleId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Comment_articleId_idx" ON "Comment"("articleId");

CREATE TABLE "AuditEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "meta" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "actorId" UUID,
  CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType","entityId");

-- Helpful indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- UpdatedAt triggers (simple approach: app updates updatedAt; for MVP we keep defaults)
