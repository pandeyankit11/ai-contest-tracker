require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting");

  const result = await prisma.$queryRaw`SELECT NOW()`;

  console.log(result);

  await prisma.$disconnect();
}

main().catch(console.error);
