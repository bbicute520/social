import { ClerkExpressRequireAuth, clerkClient } from "@clerk/clerk-sdk-node";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "./error.middleware";
import { prisma } from "../lib/prisma";
import { ensureAuthUser } from "../services/user.service";

const clerkRequireAuth = ClerkExpressRequireAuth() as any;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "test") {
    const testUserId = req.headers["x-test-user-id"];

    if (typeof testUserId === "string" && testUserId.trim().length > 0) {
      (req as any).auth = { userId: testUserId };
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  }

  return clerkRequireAuth(req as any, res as any, async (err: any) => {
    if (err) return next(err);

    // Auto-create user if not exists
    try {
      const authReq = req as any;
      const userId = authReq.auth?.userId;

      if (userId) {
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
          // Fetch user from Clerk
          const clerkUser = await clerkClient.users.getUser(userId);

          // Auto-create auth user in app database.
          await ensureAuthUser({
            userId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            usernameHint: clerkUser.username,
          });

          console.log(`✅ Auto-created user ${userId} in database`);
        }
      }
    } catch (error) {
      console.error("Error auto-creating user:", error);
      // Continue anyway - user might exist but there was a race condition
    }

    next();
  });
};

export const getAuthUserId = (req: Request): string => {
  const authReq = req as any;
  const userId = authReq.auth?.userId as string | undefined;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  return userId;
};
