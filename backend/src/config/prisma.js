const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { env } = require("./env");

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const globalForPrisma = globalThis;

const adapter =
  globalForPrisma.prismaPgAdapter ||
  new PrismaPg({ connectionString: env.databaseUrl });

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: env.nodeEnv === "development" ? ["error", "warn"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPgAdapter = adapter;
}

async function disconnectPrisma() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  disconnectPrisma,
};
