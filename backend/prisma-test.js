const { prisma } = require("./src/config/prisma");

async function main() {
  console.log("Connecting...");
  await prisma.$connect();
  console.log("Connected!");

  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log(result);
  } catch (err) {
    console.log("CODE:", err.code);
    console.log("META:", err.meta);
    console.log("MESSAGE:", err.message);
    console.log("FULL:");
    console.dir(err, { depth: null });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
