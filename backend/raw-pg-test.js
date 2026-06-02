require("dotenv").config();

const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log("Connecting...");
  await client.connect();

  console.log("Connected!");

  const result = await client.query("SELECT NOW()");

  console.log("RESULT:");
  console.log(result.rows);

  await client.end();
}

main().catch(console.error);
