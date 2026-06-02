require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  const adapter = new PrismaPg(process.env.DATABASE_URL);

  const prisma = new PrismaClient({
    adapter,
  });

  console.log("CONNECT");
  await prisma.$connect();

  console.log("QUERY");

  const result = await prisma.$queryRawUnsafe("SELECT NOW()");

  console.log(result);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:");
  console.error(e);
});
