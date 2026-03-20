import "dotenv/config";
import { prisma } from "../src/lib/prisma";

type SeedConfig = {
  users: number;
  posts: number;
  maxCommentsPerPost: number;
  maxLikesPerPost: number;
  maxLikesPerComment: number;
  maxFollowsPerUser: number;
  maxRepostsPerPost: number;
};

const DEFAULT_CONFIG: SeedConfig = {
  users: 80,
  posts: 420,
  maxCommentsPerPost: 6,
  maxLikesPerPost: 24,
  maxLikesPerComment: 8,
  maxFollowsPerUser: 18,
  maxRepostsPerPost: 6,
};

function parseNumberArg(name: string, fallback: number): number {
  const raw = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!raw) return fallback;
  const parsed = Number(raw.split("=")[1]);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function getConfig(): SeedConfig {
  return {
    users: parseNumberArg("users", DEFAULT_CONFIG.users),
    posts: parseNumberArg("posts", DEFAULT_CONFIG.posts),
    maxCommentsPerPost: parseNumberArg(
      "maxCommentsPerPost",
      DEFAULT_CONFIG.maxCommentsPerPost
    ),
    maxLikesPerPost: parseNumberArg(
      "maxLikesPerPost",
      DEFAULT_CONFIG.maxLikesPerPost
    ),
    maxLikesPerComment: parseNumberArg(
      "maxLikesPerComment",
      DEFAULT_CONFIG.maxLikesPerComment
    ),
    maxFollowsPerUser: parseNumberArg(
      "maxFollowsPerUser",
      DEFAULT_CONFIG.maxFollowsPerUser
    ),
    maxRepostsPerPost: parseNumberArg(
      "maxRepostsPerPost",
      DEFAULT_CONFIG.maxRepostsPerPost
    ),
  };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickUnique<T>(items: T[], count: number): T[] {
  if (count <= 0 || items.length === 0) return [];
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function makeUsername(index: number): string {
  return `seed_user_${String(index).padStart(4, "0")}`;
}

function makeDisplayName(index: number): string {
  return `Seed User ${index}`;
}

function makePostContent(userName: string, postIndex: number): string {
  const topics = [
    "TypeScript",
    "React",
    "Node.js",
    "Prisma",
    "UX",
    "Testing",
    "Cloud",
    "DevOps",
  ];
  const actions = [
    "just shipped",
    "is exploring",
    "is refactoring",
    "is benchmarking",
    "is learning",
    "is documenting",
  ];
  const topic = topics[randInt(0, topics.length - 1)];
  const action = actions[randInt(0, actions.length - 1)];
  return `${userName} ${action} ${topic}. Post #${postIndex}.`;
}

function makeCommentContent(author: string): string {
  const templates = [
    "Great point from {author}.",
    "I tested this approach, works well.",
    "Can you share more details?",
    "This is useful for my current task.",
    "Thanks for sharing this update.",
  ];
  const t = templates[randInt(0, templates.length - 1)];
  return t.replace("{author}", author);
}

async function main() {
  const config = getConfig();
  const start = Date.now();

  console.log("[seed-large] Config:", config);
  console.log("[seed-large] Append mode (no deleteMany): existing data is preserved.");

  console.log("[seed-large] Creating users...");
  const usersData = Array.from({ length: config.users }, (_, idx) => {
    const index = idx + 1;
    const username = makeUsername(index);
    return {
      id: `seed_${username}`,
      email: `${username}@example.com`,
      username,
      displayName: makeDisplayName(index),
      bio: `Bio of ${username}`,
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        makeDisplayName(index)
      )}&background=random&color=fff`,
    };
  });

  await prisma.user.createMany({ data: usersData, skipDuplicates: true });
  const users = await prisma.user.findMany({
    where: { id: { startsWith: "seed_" } },
    select: { id: true, username: true },
    orderBy: { createdAt: "asc" },
  });

  console.log("[seed-large] Creating profile links...");
  const profileLinks: Array<{ userId: string; label: string; url: string; sortOrder: number }> = [];
  for (const user of users) {
    if (Math.random() < 0.6) {
      profileLinks.push({
        userId: user.id,
        label: "Website",
        url: `https://${user.username}.dev`,
        sortOrder: 0,
      });
    }
    if (Math.random() < 0.4) {
      profileLinks.push({
        userId: user.id,
        label: "GitHub",
        url: `https://github.com/${user.username}`,
        sortOrder: 1,
      });
    }
  }
  if (profileLinks.length > 0) {
    await prisma.profileLink.createMany({ data: profileLinks });
  }

  console.log("[seed-large] Creating follow graph...");
  const follows: Array<{ followerId: string; followingId: string }> = [];
  const followSeen = new Set<string>();
  for (const user of users) {
    const candidates = users.filter((u) => u.id !== user.id);
    const picked = pickUnique(candidates, randInt(0, config.maxFollowsPerUser));
    for (const target of picked) {
      const key = `${user.id}:${target.id}`;
      if (followSeen.has(key)) continue;
      followSeen.add(key);
      follows.push({ followerId: user.id, followingId: target.id });
    }
  }
  if (follows.length > 0) {
    await prisma.follow.createMany({ data: follows, skipDuplicates: true });
  }

  console.log("[seed-large] Creating posts...");
  const postsData = Array.from({ length: config.posts }, (_, idx) => {
    const author = users[randInt(0, users.length - 1)];
    return {
      authorId: author.id,
      content: makePostContent(author.username, idx + 1),
      imageUrls: Math.random() < 0.25 ? [
        `https://picsum.photos/seed/${author.username}-${idx}/800/600`,
      ] : [],
    };
  });

  await prisma.post.createMany({ data: postsData });
  const posts = await prisma.post.findMany({
    where: { authorId: { startsWith: "seed_" } },
    select: { id: true, authorId: true },
  });

  console.log("[seed-large] Creating comments...");
  const commentsData: Array<{ postId: string; authorId: string; content: string; parentId?: string }> = [];
  for (const post of posts) {
    const topLevelCount = randInt(0, config.maxCommentsPerPost);
    const topLevelTemp: Array<{ tempId: string; postId: string; authorId: string; content: string }> = [];

    for (let i = 0; i < topLevelCount; i++) {
      const author = users[randInt(0, users.length - 1)];
      const tempId = `tmp_${post.id}_${i}`;
      topLevelTemp.push({
        tempId,
        postId: post.id,
        authorId: author.id,
        content: makeCommentContent(author.username),
      });
    }

    for (const top of topLevelTemp) {
      commentsData.push({
        postId: top.postId,
        authorId: top.authorId,
        content: top.content,
      });
    }
  }

  if (commentsData.length > 0) {
    await prisma.comment.createMany({ data: commentsData });
  }

  const comments = await prisma.comment.findMany({
    where: { authorId: { startsWith: "seed_" } },
    select: { id: true, postId: true, authorId: true },
  });

  console.log("[seed-large] Creating likes...");
  const postLikes: Array<{ userId: string; postId: string }> = [];
  const postLikeSeen = new Set<string>();
  for (const post of posts) {
    const picked = pickUnique(users, randInt(0, config.maxLikesPerPost));
    for (const user of picked) {
      const key = `${user.id}:${post.id}`;
      if (postLikeSeen.has(key)) continue;
      postLikeSeen.add(key);
      postLikes.push({ userId: user.id, postId: post.id });
    }
  }
  if (postLikes.length > 0) {
    await prisma.like.createMany({ data: postLikes, skipDuplicates: true });
  }

  const commentLikes: Array<{ userId: string; commentId: string }> = [];
  const commentLikeSeen = new Set<string>();
  for (const comment of comments) {
    const picked = pickUnique(users, randInt(0, config.maxLikesPerComment));
    for (const user of picked) {
      const key = `${user.id}:${comment.id}`;
      if (commentLikeSeen.has(key)) continue;
      commentLikeSeen.add(key);
      commentLikes.push({ userId: user.id, commentId: comment.id });
    }
  }
  if (commentLikes.length > 0) {
    await prisma.like.createMany({ data: commentLikes, skipDuplicates: true });
  }

  console.log("[seed-large] Creating reposts...");
  const reposts: Array<{ userId: string; postId: string }> = [];
  const repostSeen = new Set<string>();
  for (const post of posts) {
    const picked = pickUnique(users, randInt(0, config.maxRepostsPerPost));
    for (const user of picked) {
      if (user.id === post.authorId) continue;
      const key = `${user.id}:${post.id}`;
      if (repostSeen.has(key)) continue;
      repostSeen.add(key);
      reposts.push({ userId: user.id, postId: post.id });
    }
  }
  if (reposts.length > 0) {
    await prisma.repost.createMany({ data: reposts, skipDuplicates: true });
  }

  console.log("[seed-large] Creating notifications...");
  const notifications: Array<{
    recipientId: string;
    actorId: string;
    type: "FOLLOW" | "LIKE_POST" | "LIKE_COMMENT" | "COMMENT";
    postId?: string;
    commentId?: string;
    isRead?: boolean;
  }> = [];

  for (const f of follows.slice(0, Math.min(400, follows.length))) {
    notifications.push({
      recipientId: f.followingId,
      actorId: f.followerId,
      type: "FOLLOW",
      isRead: Math.random() < 0.35,
    });
  }

  for (const l of postLikes.slice(0, Math.min(900, postLikes.length))) {
    const post = posts.find((p) => p.id === l.postId);
    if (!post || post.authorId === l.userId) continue;
    notifications.push({
      recipientId: post.authorId,
      actorId: l.userId,
      type: "LIKE_POST",
      postId: l.postId,
      isRead: Math.random() < 0.35,
    });
  }

  for (const l of commentLikes.slice(0, Math.min(700, commentLikes.length))) {
    const comment = comments.find((c) => c.id === l.commentId);
    if (!comment || comment.authorId === l.userId) continue;
    notifications.push({
      recipientId: comment.authorId,
      actorId: l.userId,
      type: "LIKE_COMMENT",
      postId: comment.postId,
      commentId: comment.id,
      isRead: Math.random() < 0.35,
    });
  }

  for (const c of comments.slice(0, Math.min(900, comments.length))) {
    const post = posts.find((p) => p.id === c.postId);
    if (!post || post.authorId === c.authorId) continue;
    notifications.push({
      recipientId: post.authorId,
      actorId: c.authorId,
      type: "COMMENT",
      postId: c.postId,
      commentId: c.id,
      isRead: Math.random() < 0.35,
    });
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }

  console.log("[seed-large] Recalculating counters...");
  for (const post of posts) {
    const [commentCount, likeCount] = await Promise.all([
      prisma.comment.count({ where: { postId: post.id } }),
      prisma.like.count({ where: { postId: post.id } }),
    ]);

    await prisma.post.update({
      where: { id: post.id },
      data: { commentCount, likeCount },
    });
  }

  for (const comment of comments) {
    const likeCount = await prisma.like.count({ where: { commentId: comment.id } });
    await prisma.comment.update({
      where: { id: comment.id },
      data: { likeCount },
    });
  }

  const durationMs = Date.now() - start;

  console.log("\n[seed-large] Done");
  console.log("----------------------------------------");
  console.log(`Users:         ${users.length}`);
  console.log(`ProfileLinks:  ${profileLinks.length}`);
  console.log(`Follows:       ${follows.length}`);
  console.log(`Posts:         ${posts.length}`);
  console.log(`Comments:      ${comments.length}`);
  console.log(`Post Likes:    ${postLikes.length}`);
  console.log(`Comment Likes: ${commentLikes.length}`);
  console.log(`Reposts:       ${reposts.length}`);
  console.log(`Notifications: ${notifications.length}`);
  console.log(`Duration:      ${(durationMs / 1000).toFixed(2)}s`);
  console.log("----------------------------------------");
}

main()
  .catch((error) => {
    console.error("[seed-large] Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
