import { prisma } from "../lib/prisma";

export const searchUsers = async (q: string, limit: number, viewerId: string) => {
  const normalizedQuery = q.trim();

  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      ...(normalizedQuery
        ? {
            OR: [
              { username: { contains: normalizedQuery, mode: "insensitive" } },
              { displayName: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
      followers: {
        where: {
          followerId: viewerId,
        },
        select: {
          followerId: true,
        },
        take: 1,
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return users.map(({ followers, ...user }) => ({
    ...user,
    avatar: user.imageUrl,
    isFollowing: followers.length > 0,
  }));
};

export const searchPosts = async (q: string, limit: number) => {
  const normalizedQuery = q.trim();

  return prisma.post.findMany({
    where: normalizedQuery
      ? {
          content: { contains: normalizedQuery, mode: "insensitive" },
        }
      : {},
    include: { author: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
};
