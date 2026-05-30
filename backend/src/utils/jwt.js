const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { AppError } = require("./AppError");

function getJwtSecret() {
  if (!env.jwtSecret) {
    throw new AppError(
      "JWT secret is not configured",
      500,
      "JWT_SECRET_MISSING"
    );
  }

  return env.jwtSecret;
}

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    getJwtSecret(),
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

function verifyAuthToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Authentication token expired", 401, "TOKEN_EXPIRED");
    }

    throw new AppError("Invalid authentication token", 401, "INVALID_TOKEN");
  }
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
