const { prisma } = require("./src/config/prisma");

async function main() {
  console.log("Testing DB...");

  const users = await prisma.user.findMany();

  console.log("Success!");
  console.log(users);
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
