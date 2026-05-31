const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");
const { validateCodeforcesHandle } = require("../validators/codeforces.validator");

const CODEFORCES_USER_INFO_URL = "https://codeforces.com/api/user.info";
const CODEFORCES_PLATFORM = "CODEFORCES";

let fetchImplementation = (...args) => globalThis.fetch(...args);

function setCodeforcesFetchImplementation(nextFetchImplementation) {
  fetchImplementation = nextFetchImplementation;
}

function resetCodeforcesFetchImplementation() {
  fetchImplementation = (...args) => globalThis.fetch(...args);
}

function isRateLimitComment(comment) {
  return typeof comment === "string" && /rate|limit|too many/i.test(comment);
}

function assertValidProfile(profile) {
  const hasValidHandle =
    profile && typeof profile === "object" && typeof profile.handle === "string";

  if (!hasValidHandle) {
    throw new AppError(
      "Codeforces returned an invalid profile response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }
}

function assertValidFetchResponse(response) {
  const isValidResponse =
    response &&
    typeof response === "object" &&
    typeof response.status === "number" &&
    typeof response.ok === "boolean" &&
    typeof response.json === "function";

  if (!isValidResponse) {
    throw new AppError(
      "Codeforces returned an invalid HTTP response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function normalizeString(value) {
  return typeof value === "string" ? value : null;
}

function formatProfile(profile) {
  assertValidProfile(profile);

  return {
    handle: profile.handle,
    rating: normalizeNumber(profile.rating),
    maxRating: normalizeNumber(profile.maxRating),
    rank: normalizeString(profile.rank),
    maxRank: normalizeString(profile.maxRank),
    contribution: normalizeNumber(profile.contribution),
  };
}

async function getUserCodeforcesAccount(userId) {
  return prisma.contestAccount.findFirst({
    where: {
      userId,
      platform: CODEFORCES_PLATFORM,
    },
    select: {
      handle: true,
    },
  });
}

async function fetchCodeforcesProfile(handle) {
  if (typeof fetchImplementation !== "function") {
    throw new AppError(
      "Codeforces API client is not available",
      502,
      "CODEFORCES_API_UNAVAILABLE"
    );
  }

  let response;

  try {
    response = await fetchImplementation(
      `${CODEFORCES_USER_INFO_URL}?handles=${encodeURIComponent(handle)}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }
    );
  } catch (_error) {
    throw new AppError(
      "Unable to reach Codeforces API",
      502,
      "CODEFORCES_API_UNAVAILABLE"
    );
  }

  assertValidFetchResponse(response);

  if (response.status === 429) {
    throw new AppError(
      "Codeforces API rate limit exceeded",
      429,
      "CODEFORCES_RATE_LIMITED"
    );
  }

  if (!response.ok) {
    throw new AppError(
      "Codeforces API request failed",
      502,
      "CODEFORCES_API_ERROR"
    );
  }

  let payload;

  try {
    payload = await response.json();
  } catch (_error) {
    throw new AppError(
      "Codeforces returned an invalid JSON response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }

  if (payload.status === "FAILED") {
    if (isRateLimitComment(payload.comment)) {
      throw new AppError(
        "Codeforces API rate limit exceeded",
        429,
        "CODEFORCES_RATE_LIMITED"
      );
    }

    throw new AppError(
      payload.comment || "Codeforces API request failed",
      502,
      "CODEFORCES_API_ERROR"
    );
  }

  const hasValidResult =
    payload.status === "OK" &&
    Array.isArray(payload.result) &&
    payload.result.length > 0;

  if (!hasValidResult) {
    throw new AppError(
      "Codeforces returned an invalid profile response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }

  return formatProfile(payload.result[0]);
}

async function getCodeforcesProfileForUser(userId) {
  const account = await getUserCodeforcesAccount(userId);

  if (!account) {
    throw new AppError(
      "Codeforces account not found for this user",
      404,
      "CODEFORCES_ACCOUNT_NOT_FOUND"
    );
  }

  const handle = validateCodeforcesHandle(account.handle);

  return fetchCodeforcesProfile(handle);
}

module.exports = {
  CODEFORCES_PLATFORM,
  CODEFORCES_USER_INFO_URL,
  fetchCodeforcesProfile,
  getCodeforcesProfileForUser,
  resetCodeforcesFetchImplementation,
  setCodeforcesFetchImplementation,
};
