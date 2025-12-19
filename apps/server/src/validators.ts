import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const BootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export const SpaceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const CollectionSchema = z.object({
  spaceId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
});

export const ArticleCreateSchema = z.object({
  spaceId: z.string().uuid(),
  collectionId: z.string().uuid().optional().nullable(),
  title: z.string().min(3),
  type: z.enum(["RUNBOOK", "TROUBLESHOOTING", "SOP", "HOW_TO", "ARCHITECTURE", "CHANGE_PROCEDURE"]),
  content: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  ownerId: z.string().uuid().optional().nullable(),
});

export const ArticleUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  ownerId: z.string().uuid().optional().nullable(),
  lastVerifiedAt: z.string().datetime().optional().nullable(),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "DEPRECATED"]).optional(),
  changeSummary: z.string().max(200).optional().nullable(),
});

export const CommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const UpdateUserRolesSchema = z.object({
  roles: z.array(z.enum(["ADMIN", "APPROVER", "CONTRIBUTOR", "READER"])).min(1),
});
