const { prisma } = require("./src/config/prisma");

async function main() {
  const users = await prisma.user.findMany({
    take: 1,
  });

  console.log(users);
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
