const { env } = require("../config/env");
const { AppError } = require("../utils/AppError");

function notFoundHandler(req, _res, next) {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND"
    )
  );
}

function normalizeError(error) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return new AppError("Malformed JSON request body", 400, "MALFORMED_JSON");
  }

  if (error && error.code === "P2002") {
    return new AppError(
      "A record with this value already exists",
      409,
      "UNIQUE_CONSTRAINT_FAILED"
    );
  }

  if (error instanceof AppError) {
    return error;
  }

  return new AppError("Internal server error", 500, "INTERNAL_SERVER_ERROR");
}

function errorHandler(error, _req, res, _next) {
  const normalizedError = normalizeError(error);

  if (
    normalizedError.statusCode >= 500 &&
    env.nodeEnv !== "test" &&
    error &&
    !error.isOperational
  ) {
    console.error(error);
  }

  const response = {
    success: false,
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
    },
  };

  if (normalizedError.details) {
    response.error.details = normalizedError.details;
  }

  res.status(normalizedError.statusCode).json(response);
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
