const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");

const CODEFORCES_CONTESTS_URL = "https://codeforces.com/api/contest.list";
const CODEFORCES_PLATFORM = "CODEFORCES";

const PHASE_MAP = {
  BEFORE: "BEFORE",
  CODING: "CODING",
  PENDING_SYSTEM_TEST: "PENDING_SYSTEM_TEST",
  SYSTEM_TEST: "SYSTEM_TEST",
  FINISHED: "FINISHED",
};

let fetchImplementation = (...args) => globalThis.fetch(...args);

function setContestsFetchImplementation(nextFetchImplementation) {
  fetchImplementation = nextFetchImplementation;
}

function resetContestsFetchImplementation() {
  fetchImplementation = (...args) => globalThis.fetch(...args);
}

function normalizeContestPhase(phase) {
  return PHASE_MAP[phase] || null;
}

function formatContest(rawContest) {
  const phase = normalizeContestPhase(rawContest.phase);

  if (!phase) {
    return null;
  }

  return {
    externalId: rawContest.id,
    platform: CODEFORCES_PLATFORM,
    name: rawContest.name,
    phase,
    startTime: new Date(rawContest.startTimeSeconds * 1000),
    endTime: new Date((rawContest.startTimeSeconds + rawContest.durationSeconds) * 1000),
    durationSeconds: rawContest.durationSeconds,
  };
}

async function fetchCodeforcesContests() {
  if (typeof fetchImplementation !== "function") {
    throw new AppError(
      "Codeforces API client is not available",
      502,
      "CONTESTS_API_UNAVAILABLE"
    );
  }

  let response;

  try {
    response = await fetchImplementation(`${CODEFORCES_CONTESTS_URL}`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });
  } catch (_error) {
    throw new AppError(
      "Unable to reach Codeforces API",
      502,
      "CONTESTS_API_UNAVAILABLE"
    );
  }

  if (!response || typeof response !== "object") {
    throw new AppError(
      "Codeforces returned an invalid HTTP response",
      502,
      "CONTESTS_INVALID_RESPONSE"
    );
  }

  if (response.status === 429) {
    throw new AppError(
      "Codeforces API rate limit exceeded",
      429,
      "CONTESTS_RATE_LIMITED"
    );
  }

  if (!response.ok) {
    throw new AppError(
      "Codeforces API request failed",
      502,
      "CONTESTS_API_ERROR"
    );
  }

  let payload;

  try {
    payload = await response.json();
  } catch (_error) {
    throw new AppError(
      "Codeforces returned an invalid JSON response",
      502,
      "CONTESTS_INVALID_RESPONSE"
    );
  }

  if (payload.status === "FAILED") {
    throw new AppError(
      payload.comment || "Codeforces API request failed",
      502,
      "CONTESTS_API_ERROR"
    );
  }

  if (payload.status !== "OK" || !Array.isArray(payload.result)) {
    throw new AppError(
      "Codeforces returned an invalid contests response",
      502,
      "CONTESTS_INVALID_RESPONSE"
    );
  }

  return payload.result;
}

async function syncCodeforcesContests() {
  const rawContests = await fetchCodeforcesContests();
  const formattedContests = rawContests
    .map(formatContest)
    .filter((contest) => contest !== null);

  const results = {
    created: 0,
    updated: 0,
    failed: 0,
  };

  for (const contest of formattedContests) {
    try {
      const existingContest = await prisma.contest.findUnique({
        where: {
          platform_externalId: {
            platform: contest.platform,
            externalId: contest.externalId,
          },
        },
      });

      if (existingContest) {
        await prisma.contest.update({
          where: {
            id: existingContest.id,
          },
          data: {
            phase: contest.phase,
          },
        });
        results.updated += 1;
      } else {
        await prisma.contest.create({
          data: contest,
        });
        results.created += 1;
      }
    } catch (_error) {
      results.failed += 1;
    }
  }

  return results;
}

module.exports = {
  CODEFORCES_PLATFORM,
  CODEFORCES_CONTESTS_URL,
  syncCodeforcesContests,
  setContestsFetchImplementation,
  resetContestsFetchImplementation,
};
