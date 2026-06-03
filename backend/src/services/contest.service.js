const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");
const leetcodeService = require("./leetcode.service");

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
  if (!phase) return null;

  return {
    externalId: String(rawContest.id),
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
    throw new AppError("Codeforces API client is not available", 502, "CONTESTS_API_UNAVAILABLE");
  }

  let response;
  try {
    // CRITICAL: We added the User-Agent header here to bypass Cloudflare
    response = await fetchImplementation(CODEFORCES_CONTESTS_URL, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
  } catch (_error) {
    throw new AppError("Unable to reach Codeforces API", 502, "CONTESTS_API_UNAVAILABLE");
  }

  const payload = await response.json();
  if (payload.status !== "OK" || !Array.isArray(payload.result)) {
    throw new AppError("Codeforces returned an invalid contests response", 502, "CONTESTS_INVALID_RESPONSE");
  }
  return payload.result;
}

async function syncCodeforcesContests() {
  const rawContests = await fetchCodeforcesContests();
  const formattedContests = rawContests.map(formatContest).filter(c => c !== null);

  const results = { created: 0, updated: 0, failed: 0 };

  for (const contest of formattedContests) {
    try {
      await prisma.contest.upsert({
        where: { platform_externalId: { platform: CODEFORCES_PLATFORM, externalId: contest.externalId } },
        update: { phase: contest.phase },
        create: contest,
      });
      results.created += 1;
    } catch (_error) { results.failed += 1; }
  }
  return results;
}

async function syncAllContests() {
  console.log("\n[CONTEST SERVICE] --- Starting Global Parallel Contest Sync ---");

  // Helper to wrap Codeforces execution with timeout and logs
  const executeCodeforcesSync = async () => {
    console.log("[CONTEST SERVICE] -> Triggering Codeforces contest sync...");
    const codeforcesTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT: Codeforces API request hung for 30 seconds")), 30000)
    );
    const result = await Promise.race([
      syncCodeforcesContests(),
      codeforcesTimeout
    ]);
    console.log("[CONTEST SERVICE] <- SUCCESS: Codeforces contests synced.");
    return result;
  };

  // Helper to wrap LeetCode execution with logs
  const executeLeetCodeSync = async () => {
    console.log("[CONTEST SERVICE] -> Triggering LeetCode contest sync...");
    const result = await leetcodeService.syncLeetCodeContests();
    console.log("[CONTEST SERVICE] <- SUCCESS: LeetCode contests synced.");
    return result;
  };

  // FIRING BOTH REQUESTS IN PARALLEL
  const [cfResult, lcResult] = await Promise.allSettled([
    executeCodeforcesSync(),
    executeLeetCodeSync()
  ]);

  // Aggregate the results cleanly based on whether they fulfilled or rejected
  const results = {
    codeforces: cfResult.status === "fulfilled" ? cfResult.value : { error: cfResult.reason.message },
    leetcode: lcResult.status === "fulfilled" ? lcResult.value : { error: lcResult.reason.message },
  };

  // Log failures cleanly if one of them dropped
  if (cfResult.status === "rejected") {
    console.error("[CONTEST SERVICE] <- ERROR/SKIPPED: Codeforces sync failed:", cfResult.reason.message);
  }
  if (lcResult.status === "rejected") {
    console.error("[CONTEST SERVICE] <- ERROR/SKIPPED: LeetCode sync failed:", lcResult.reason.message);
  }

  console.log("[CONTEST SERVICE] --- Global Parallel Contest Sync Complete ---\n");
  return results;
}

async function getUpcomingContests({ page = 1, limit = 10, days = 30, platform }) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const where = { startTime: { gte: now, lte: futureDate } };
  if (platform) where.platform = platform;

  const skip = (page - 1) * limit;

  const [contests, total] = await Promise.all([
    prisma.contest.findMany({ where, orderBy: [{ startTime: "asc" }], skip, take: limit }),
    prisma.contest.count({ where }),
  ]);

  return {
    contests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getUserContestHistory(userId) {
  return prisma.contestParticipation.findMany({
    where: { userId },
    orderBy: { participatedAt: "desc" },
    select: {
      id: true,
      platform: true,
      externalContestId: true,
      rank: true,
      oldRating: true,
      newRating: true,
      ratingChange: true,
      participatedAt: true,
    },
  });
}

module.exports = {
  CODEFORCES_PLATFORM,
  CODEFORCES_CONTESTS_URL,
  syncCodeforcesContests,
  setContestsFetchImplementation,
  resetContestsFetchImplementation,
  getUpcomingContests,
  getUserContestHistory,
  syncAllContests,
};