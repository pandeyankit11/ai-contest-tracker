const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");
const { validateCodeforcesHandle } = require("../validators/codeforces.validator");

const CODEFORCES_USER_INFO_URL = "https://codeforces.com/api/user.info";
const CODEFORCES_RATING_HISTORY_URL = "https://codeforces.com/api/user.rating";
const CODEFORCES_SUBMISSIONS_URL = "https://codeforces.com/api/user.status";
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

function assertValidRatingUpdate(update) {
  const hasValidRatingUpdate =
    update &&
    typeof update === "object" &&
    Number.isFinite(update.ratingUpdateTimeSeconds) &&
    Number.isFinite(update.newRating);

  if (!hasValidRatingUpdate) {
    throw new AppError(
      "Codeforces returned an invalid rating history response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }
}

function formatRatingSnapshot(userId, update, maxRating) {
  assertValidRatingUpdate(update);

  return {
    userId,
    platform: CODEFORCES_PLATFORM,
    rating: update.newRating,
    maxRating,
    rank: null,
    recordedAt: new Date(update.ratingUpdateTimeSeconds * 1000),
  };
}

function buildProblemExternalId(problem) {
  if (!problem || typeof problem !== "object") {
    return null;
  }

  if (Number.isFinite(problem.contestId) && typeof problem.index === "string") {
    return `${problem.contestId}-${problem.index}`;
  }

  if (typeof problem.problemsetName === "string" && typeof problem.index === "string") {
    return `${problem.problemsetName}-${problem.index}`;
  }

  if (typeof problem.name === "string" && problem.name.trim().length > 0) {
    return problem.name.trim();
  }

  return null;
}

function buildProblemUrl(problem) {
  if (Number.isFinite(problem.contestId) && typeof problem.index === "string") {
    return `https://codeforces.com/problemset/problem/${problem.contestId}/${encodeURIComponent(problem.index)}`;
  }

  return null;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0);
}

function assertValidAcceptedSubmission(submission) {
  const hasValidSubmission =
    submission &&
    typeof submission === "object" &&
    submission.verdict === "OK" &&
    Number.isFinite(submission.creationTimeSeconds) &&
    submission.problem &&
    typeof submission.problem === "object" &&
    typeof submission.problem.name === "string" &&
    buildProblemExternalId(submission.problem);

  if (!hasValidSubmission) {
    throw new AppError(
      "Codeforces returned an invalid solved problem response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }
}

function formatSolvedProblem(userId, submission) {
  assertValidAcceptedSubmission(submission);

  const { problem } = submission;

  return {
    userId,
    contestId: null,
    platform: CODEFORCES_PLATFORM,
    externalId: buildProblemExternalId(problem),
    name: problem.name,
    url: buildProblemUrl(problem),
    tags: normalizeTags(problem.tags),
    difficulty: null,
    rating: normalizeNumber(problem.rating),
    solvedAt: new Date(submission.creationTimeSeconds * 1000),
  };
}

async function fetchCodeforcesPayload(url) {
  if (typeof fetchImplementation !== "function") {
    throw new AppError(
      "Codeforces API client is not available",
      502,
      "CODEFORCES_API_UNAVAILABLE"
    );
  }

  let response;

  try {
    response = await fetchImplementation(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        // CRITICAL: This bypasses the Codeforces Cloudflare bot block
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
    });
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

  return payload;
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
  const payload = await fetchCodeforcesPayload(
    `${CODEFORCES_USER_INFO_URL}?handles=${encodeURIComponent(handle)}`
  );

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

async function fetchCodeforcesRatingHistory(handle) {
  const payload = await fetchCodeforcesPayload(
    `${CODEFORCES_RATING_HISTORY_URL}?handle=${encodeURIComponent(handle)}`
  );

  const hasValidResult = payload.status === "OK" && Array.isArray(payload.result);

  if (!hasValidResult) {
    throw new AppError(
      "Codeforces returned an invalid rating history response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }

  return payload.result;
}

async function fetchCodeforcesSubmissions(handle) {
  const payload = await fetchCodeforcesPayload(
    `${CODEFORCES_SUBMISSIONS_URL}?handle=${encodeURIComponent(handle)}`
  );

  const hasValidResult = payload.status === "OK" && Array.isArray(payload.result);

  if (!hasValidResult) {
    throw new AppError(
      "Codeforces returned an invalid submissions response",
      502,
      "CODEFORCES_INVALID_RESPONSE"
    );
  }

  return payload.result;
}

async function syncRatingHistory(userId, handle) {
  const validHandle = validateCodeforcesHandle(handle);
  const ratingHistory = await fetchCodeforcesRatingHistory(validHandle);
  const sortedHistory = [...ratingHistory].sort(
    (left, right) => left.ratingUpdateTimeSeconds - right.ratingUpdateTimeSeconds
  );

  const results = {
    processed: 0,
    upserted: 0,
    failed: 0,
  };
  let maxRating = null;

  for (const update of sortedHistory) {
    try {
      assertValidRatingUpdate(update);
      maxRating =
        maxRating === null ? update.newRating : Math.max(maxRating, update.newRating);

      const snapshot = formatRatingSnapshot(userId, update, maxRating);

      await prisma.ratingSnapshot.upsert({
        where: {
          userId_platform_recordedAt: {
            userId: snapshot.userId,
            platform: snapshot.platform,
            recordedAt: snapshot.recordedAt,
          },
        },
        update: {
          rating: snapshot.rating,
          maxRating: snapshot.maxRating,
          rank: snapshot.rank,
        },
        create: snapshot,
      });

      results.processed += 1;
      results.upserted += 1;
    } catch (_error) {
      results.failed += 1;
    }
  }

  return results;
}

// ... [Keep everything above syncSolvedProblems exactly the same] ...

async function syncSolvedProblems(userId, handle) {
  const validHandle = validateCodeforcesHandle(handle);
  const submissions = await fetchCodeforcesSubmissions(validHandle);
  const acceptedProblems = new Map();
  const results = {
    processed: 0,
    upserted: 0,
    failed: 0,
  };

  for (const submission of submissions) {
    if (!submission || submission.verdict !== "OK") {
      continue;
    }

    try {
      const solvedProblem = formatSolvedProblem(userId, submission);
      const existingProblem = acceptedProblems.get(solvedProblem.externalId);

      if (!existingProblem || solvedProblem.solvedAt < existingProblem.solvedAt) {
        acceptedProblems.set(solvedProblem.externalId, solvedProblem);
      }
    } catch (_error) {
      results.failed += 1;
    }
  }

  for (const solvedProblem of acceptedProblems.values()) {
    try {
      await prisma.solvedProblem.upsert({
        where: {
          userId_platform_externalId: {
            userId: solvedProblem.userId,
            platform: solvedProblem.platform,
            externalId: solvedProblem.externalId,
          },
        },
        update: {
          name: solvedProblem.name,
          url: solvedProblem.url,
          tags: solvedProblem.tags,
          difficulty: solvedProblem.difficulty,
          rating: solvedProblem.rating,
          solvedAt: solvedProblem.solvedAt,
        },
        create: solvedProblem,
      });

      results.processed += 1;
      results.upserted += 1;
    } catch (_error) {
      results.failed += 1;
    }
  }

  return results;
}

/**
 * NEW HOOK: Sync individual contest details into ContestParticipation model
 */
async function syncContestParticipations(userId, handle) {
  const validHandle = validateCodeforcesHandle(handle);
  const ratingHistory = await fetchCodeforcesRatingHistory(validHandle);
  
  const results = {
    processed: 0,
    upserted: 0,
    failed: 0
  };

  for (const update of ratingHistory) {
    try {
      assertValidRatingUpdate(update);
      const participatedAt = new Date(update.ratingUpdateTimeSeconds * 1000);

      await prisma.contestParticipation.upsert({
        where: {
          userId_platform_externalContestId: {
            userId,
            platform: CODEFORCES_PLATFORM,
            externalContestId: update.contestId.toString(),
          },
        },
        update: {
          rank: update.rank,
          oldRating: update.oldRating,
          newRating: update.newRating,
          ratingChange: update.newRating - update.oldRating,
        },
        create: {
          userId,
          platform: CODEFORCES_PLATFORM,
          externalContestId: update.contestId.toString(),
          rank: update.rank,
          oldRating: update.oldRating,
          newRating: update.newRating,
          ratingChange: update.newRating - update.oldRating,
          participatedAt,
        },
      });

      results.processed += 1;
      results.upserted += 1;
    } catch (_error) {
      results.failed += 1;
    }
  }

  return results;
}

/**
 * NEW HOOK: Unified coordination function used by the analytics sync endpoint
 */
async function syncAllUserData(userId) {
  const account = await getUserCodeforcesAccount(userId);
  if (!account) {
    throw new AppError(
      "Codeforces account not found for this user",
      404,
      "CODEFORCES_ACCOUNT_NOT_FOUND"
    );
  }

  const handle = validateCodeforcesHandle(account.handle);

  // Execute all sync tasks concurrently
  const [ratingResults, solvedResults, participationResults] = await Promise.all([
    syncRatingHistory(userId, handle),
    syncSolvedProblems(userId, handle),
    syncContestParticipations(userId, handle)
  ]);

  return {
    ratingSnapshots: ratingResults,
    solvedProblems: solvedResults,
    contestParticipations: participationResults
  };
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
  CODEFORCES_RATING_HISTORY_URL,
  CODEFORCES_SUBMISSIONS_URL,
  CODEFORCES_USER_INFO_URL,
  fetchCodeforcesProfile,
  fetchCodeforcesRatingHistory,
  fetchCodeforcesSubmissions,
  getCodeforcesProfileForUser,
  resetCodeforcesFetchImplementation,
  setCodeforcesFetchImplementation,
  syncRatingHistory,
  syncSolvedProblems,
  syncContestParticipations, // Added export
  syncAllUserData           // Added export
};