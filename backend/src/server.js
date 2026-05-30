const app = require("./app");
const { env } = require("./config/env");
const { disconnectPrisma } = require("./config/prisma");

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down server.`);

  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
