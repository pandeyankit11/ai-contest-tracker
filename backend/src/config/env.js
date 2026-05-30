require("dotenv").config({ quiet: true });

const DEFAULT_JWT_EXPIRES_IN = "7d";
const DEFAULT_BCRYPT_SALT_ROUNDS = 12;

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN,
  bcryptSaltRounds: parsePositiveInteger(
    process.env.BCRYPT_SALT_ROUNDS,
    DEFAULT_BCRYPT_SALT_ROUNDS
  ),
};

module.exports = {
  env,
};
