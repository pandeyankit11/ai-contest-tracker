require("dotenv").config();
const { Client } = require("pg");

async function main() {
  console.log("URL:", process.env.DATABASE_URL.split("@")[1]);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    connectionTimeoutMillis: 5000,
    family: 4,
  });

  console.log("Connecting...");

  await client.connect();

  console.log("Connected!");

  const result = await client.query("SELECT NOW()");
  console.log(result.rows);

  await client.end();
}

main().catch((err) => {
  console.error(err);
});
