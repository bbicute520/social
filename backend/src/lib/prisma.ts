import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const buildConnectionString = () => {
  const baseUrl = process.env.DATABASE_URL;

  if (!baseUrl) {
    return "";
  }

  // CI integration tests use a local Postgres service without SSL.
  if (process.env.NODE_ENV === "test") {
    return baseUrl;
  }

  try {
    const parsed = new URL(baseUrl);
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    if (!parsed.searchParams.has("uselibpqcompat")) {
      parsed.searchParams.set("uselibpqcompat", "true");
    }
    return parsed.toString();
  } catch {
    return baseUrl;
  }
};

const pool = new Pool({ connectionString: buildConnectionString() });
const adapter = new PrismaPg(pool as any);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// @ts-ignore
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
