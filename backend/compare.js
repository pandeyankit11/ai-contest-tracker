// compare.js
require("dotenv").config();

const { Client, Pool } = require("pg");

async function run() {
  console.log("NODE:", process.version);

  console.log("\nCLIENT TEST");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("CLIENT CONNECTED");

  const r1 = await client.query("SELECT NOW()");
  console.log(r1.rows);

  await client.end();

  console.log("\nPOOL TEST");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const pooled = await pool.connect();

  console.log("POOL CONNECTED");

  const r2 = await pooled.query("SELECT NOW()");
  console.log(r2.rows);

  pooled.release();

  await pool.end();
}

run().catch(console.error);
