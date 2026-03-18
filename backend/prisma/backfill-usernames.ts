import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { generateUniqueUsername } from "../src/services/user.service";

type UserWithoutUsername = {
  id: string;
  email: string | null;
};

async function main() {
  const users = await prisma.$queryRaw<UserWithoutUsername[]>`
    SELECT id, email
    FROM "User"
    WHERE username IS NULL OR username = ''
  `;

  if (users.length === 0) {
    console.log("No users need username backfill.");
    return;
  }

  console.log(`Backfilling username for ${users.length} user(s)...`);

  for (const user of users) {
    const username = await generateUniqueUsername(
      user.id,
      null,
      user.email,
      user.id
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    console.log(`- ${user.id} -> ${username}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Username backfill failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
