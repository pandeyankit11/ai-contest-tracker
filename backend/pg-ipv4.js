require("dotenv").config();
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
  });

  await client.connect();

  console.log("CONNECTED");

  const result = await client.query("SELECT NOW()");
  console.log(result.rows);

  await client.end();
}

main().catch(console.error);
