import { prisma } from "./src/lib/prisma";

async function main() {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
    },
  });

  const users = await prisma.user.findMany();

  console.log("=== DATABASE STATUS ===");
  console.log(`Users: ${users.length}`);
  console.log(`Posts: ${posts.length}`);

  console.log("\n=== USERS ===");
  users.forEach(user => {
    console.log(`- ${user.username || user.email} (${user.id})`);
  });

  console.log("\n=== POSTS ===");
  posts.forEach(post => {
    console.log(`- "${post.content.substring(0, 50)}..." by ${post.author.displayName || post.author.username}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
