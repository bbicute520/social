import { z } from "zod";

const profileLinkSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().url().max(2048),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_\.]+$/).optional(),
    displayName: z.string().min(1).max(60).optional(),
    bio: z.string().max(300).optional(),
    imageUrl: z.string().url().optional(),
    avatar: z.string().url().optional(),
    links: z.array(profileLinkSchema).max(10).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
  body: z.any().optional(),
  query: z.any().optional(),
});

export const usernameParamSchema = z.object({
  params: z.object({
    username: z.string().min(1),
  }),
  body: z.any().optional(),
  query: z.any().optional(),
});
