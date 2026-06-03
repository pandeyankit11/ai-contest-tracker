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
    // Breadcrumb 2: Did the request actually hit the auth middleware?
    console.log("[AUTH DEBUG] Middleware entered. Authorization Header:", req.get("authorization"));

    const token = parseBearerToken(req.get("authorization"));

    if (!token) {
      console.log("[AUTH DEBUG] REJECTED: Token is missing or not a Bearer token.");
      throw new AppError(
        "Bearer authentication token is required",
        401,
        "AUTH_TOKEN_REQUIRED"
      );
    }

    const payload = verifyAuthToken(token);
    const user = await getUserById(payload.sub);

    if (!user) {
      console.log(`[AUTH DEBUG] REJECTED: Token is valid, but user ID ${payload.sub} no longer exists in DB.`);
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

    // Breadcrumb 3: Success path
    console.log(`[AUTH DEBUG] SUCCESS: Token verified for user ID ${user.id}. Passing to controller...`);
    next();
  } catch (error) {
    // This will catch JWT verification errors (expired, bad signature, etc.)
    console.log("[AUTH DEBUG] ERROR/REJECTED:", error.message);
    next(error);
  }
}

module.exports = {
  authenticate,
};