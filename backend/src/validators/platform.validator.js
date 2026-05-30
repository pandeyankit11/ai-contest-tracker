const { AppError } = require("../utils/AppError");

const SUPPORTED_PLATFORMS = ["CODEFORCES", "LEETCODE"];
const HANDLE_MAX_LENGTH = 64;
const HANDLE_REGEX = /^[A-Za-z0-9_.-]+$/;

function addError(errors, field, message) {
  if (!errors[field]) {
    errors[field] = [];
  }

  errors[field].push(message);
}

function assertValid(errors) {
  if (Object.keys(errors).length > 0) {
    throw new AppError("Validation failed", 422, "VALIDATION_ERROR", errors);
  }
}

function normalizePlatform(platform) {
  if (typeof platform !== "string") {
    return "";
  }

  return platform.trim().toUpperCase();
}

function normalizeHandle(handle) {
  if (typeof handle !== "string") {
    return "";
  }

  return handle.trim();
}

function validatePlatformAccountInput(body = {}) {
  const errors = {};
  const platform = normalizePlatform(body.platform);
  const handle = normalizeHandle(body.handle);

  if (!platform) {
    addError(errors, "platform", "Platform is required");
  } else if (!SUPPORTED_PLATFORMS.includes(platform)) {
    addError(
      errors,
      "platform",
      `Platform must be one of: ${SUPPORTED_PLATFORMS.join(", ")}`
    );
  }

  if (!handle) {
    addError(errors, "handle", "Handle is required");
  } else {
    if (handle.length > HANDLE_MAX_LENGTH) {
      addError(
        errors,
        "handle",
        `Handle must be at most ${HANDLE_MAX_LENGTH} characters long`
      );
    }

    if (!HANDLE_REGEX.test(handle)) {
      addError(
        errors,
        "handle",
        "Handle may contain only letters, numbers, underscores, dots, and hyphens"
      );
    }
  }

  assertValid(errors);

  return {
    platform,
    handle,
  };
}

function validatePlatformAccountId(id) {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new AppError("Platform account id is required", 422, "VALIDATION_ERROR", {
      id: ["Platform account id is required"],
    });
  }

  return id.trim();
}

module.exports = {
  SUPPORTED_PLATFORMS,
  validatePlatformAccountId,
  validatePlatformAccountInput,
};
