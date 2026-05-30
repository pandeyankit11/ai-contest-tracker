const { getUserById } = require("../services/auth.service");
const { AppError } = require("../utils/AppError");
const { verifyAuthToken } = require("../utils/jwt");

function parseBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function authenticate(req, _res, next) {
  try {
    const token = parseBearerToken(req.get("authorization"));

    if (!token) {
      throw new AppError(
        "Bearer authentication token is required",
        401,
        "AUTH_TOKEN_REQUIRED"
      );
    }

    const payload = verifyAuthToken(token);
    const user = await getUserById(payload.sub);

    if (!user) {
      throw new AppError(
        "Authenticated user no longer exists",
        401,
        "AUTH_USER_NOT_FOUND"
      );
    }

    req.auth = {
      token,
      payload,
    };
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
};
