require("dotenv").config();
console.log(process.env.DATABASE_URL);
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },

    connectionTimeoutMillis: 30000,
  });

  console.log("CONNECTING");

  const client = await pool.connect();

  console.log("CONNECTED");

  const result = await client.query("SELECT NOW()");

  console.log(result.rows);

  client.release();

  await pool.end();
}

main().catch(console.error);
