const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const LEETCODE_PLATFORM = "LEETCODE";
const DEFAULT_RECENT_SUBMISSION_LIMIT = 100;

const LEETCODE_USER_ANALYTICS_QUERY = `
query userAnalytics($username: String!, $recentLimit: Int!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    submissionCalendar
  }
  recentAcSubmissionList(username: $username, limit: $recentLimit) {
    id
    title
    titleSlug
    timestamp
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
}
`;

const LEETCODE_QUESTION_QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    titleSlug
    difficulty
    topicTags {
      name
      slug
    }
  }
}
`;

const LEETCODE_UPCOMING_QUERY = `
query topTwoContests {
  topTwoContests {
    title
    titleSlug
    startTime
    duration
  }
}
`;

let fetchImplementation = (...args) => globalThis.fetch(...args);

function setLeetCodeFetchImplementation(nextFetchImplementation) {
  fetchImplementation = nextFetchImplementation;
}

function resetLeetCodeFetchImplementation() {
  fetchImplementation = (...args) => globalThis.fetch(...args);
}

function validateLeetCodeUsername(username) {
  if (typeof username !== "string" || username.trim().length === 0) {
    throw new AppError("LeetCode username is missing", 422, "LEETCODE_USERNAME_MISSING", {
      username: ["LeetCode username is required before fetching analytics data"],
    });
  }

  return username.trim();
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function normalizeInteger(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
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
      "LeetCode returned an invalid HTTP response",
      502,
      "LEETCODE_INVALID_RESPONSE"
    );
  }
}

function getGraphQLErrorMessage(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return "LeetCode GraphQL request failed";
  }

  const firstError = errors.find((error) => error && typeof error.message === "string");
  return firstError?.message || "LeetCode GraphQL request failed";
}

async function fetchLeetCodeGraphQL(query, variables = {}) {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // CRITICAL: This bypasses the Cloudflare infinite hang
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'https://leetcode.com/'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`LeetCode GraphQL API returned ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

function parseSubmissionCalendar(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function formatSolvedStats(acSubmissionNum = []) {
  const statsByDifficulty = new Map(
    acSubmissionNum
      .filter((entry) => entry && typeof entry.difficulty === "string")
      .map((entry) => [entry.difficulty.toLowerCase(), normalizeInteger(entry.count) || 0])
  );

  return {
    totalSolved: statsByDifficulty.get("all") || 0,
    easySolved: statsByDifficulty.get("easy") || 0,
    mediumSolved: statsByDifficulty.get("medium") || 0,
    hardSolved: statsByDifficulty.get("hard") || 0,
  };
}

function assertValidUserAnalytics(data) {
  const hasValidUser =
    data &&
    typeof data === "object" &&
    data.matchedUser &&
    typeof data.matchedUser === "object" &&
    typeof data.matchedUser.username === "string";

  if (!hasValidUser) {
    throw new AppError(
      "LeetCode user not found or returned an invalid response",
      502,
      "LEETCODE_INVALID_RESPONSE"
    );
  }
}

function formatUserAnalytics(data) {
  assertValidUserAnalytics(data);

  const acSubmissionNum = data.matchedUser.submitStats?.acSubmissionNum;

  return {
    username: data.matchedUser.username,
    solvedStats: formatSolvedStats(Array.isArray(acSubmissionNum) ? acSubmissionNum : []),
    submissionCalendar: parseSubmissionCalendar(data.matchedUser.submissionCalendar),
    recentAcceptedSubmissions: Array.isArray(data.recentAcSubmissionList)
      ? data.recentAcSubmissionList
      : [],
    contestRanking: data.userContestRanking || null,
  };
}

async function fetchLeetCodeUserAnalytics(username, { recentLimit } = {}) {
  const validUsername = validateLeetCodeUsername(username);
  const data = await fetchLeetCodeGraphQL(LEETCODE_USER_ANALYTICS_QUERY, {
    username: validUsername,
    recentLimit: recentLimit || DEFAULT_RECENT_SUBMISSION_LIMIT,
  });

  return formatUserAnalytics(data);
}

async function fetchLeetCodeQuestion(titleSlug) {
  if (typeof titleSlug !== "string" || titleSlug.trim().length === 0) {
    throw new AppError(
      "LeetCode problem slug is missing",
      422,
      "LEETCODE_PROBLEM_SLUG_MISSING"
    );
  }

  const data = await fetchLeetCodeGraphQL(LEETCODE_QUESTION_QUERY, {
    titleSlug: titleSlug.trim(),
  });

  if (!data || !data.question || typeof data.question !== "object") {
    throw new AppError(
      "LeetCode returned an invalid problem response",
      502,
      "LEETCODE_INVALID_RESPONSE"
    );
  }

  return data.question;
}

function formatLeetCodeRatingSnapshot(userId, contestRanking, recordedAt) {
  const rating = normalizeInteger(contestRanking?.rating);

  if (rating === null) {
    return null;
  }

  return {
    userId,
    platform: LEETCODE_PLATFORM,
    rating,
    maxRating: rating,
    rank: Number.isFinite(contestRanking.globalRanking)
      ? String(contestRanking.globalRanking)
      : null,
    recordedAt,
  };
}

async function syncLeetCodeRatingSnapshot(userId, contestRanking, recordedAt) {
  const snapshot = formatLeetCodeRatingSnapshot(userId, contestRanking, recordedAt);

  if (!snapshot) {
    return {
      processed: 0,
      upserted: 0,
      failed: 0,
    };
  }

  try {
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

    return {
      processed: 1,
      upserted: 1,
      failed: 0,
    };
  } catch (_error) {
    return {
      processed: 0,
      upserted: 0,
      failed: 1,
    };
  }
}

function normalizeTopicTags(topicTags) {
  if (!Array.isArray(topicTags)) {
    return [];
  }

  return topicTags
    .map((tag) => tag?.name)
    .filter((name) => typeof name === "string" && name.trim().length > 0);
}

function formatLeetCodeSolvedProblem(userId, submission, question) {
  if (
    !submission ||
    typeof submission !== "object" ||
    typeof submission.titleSlug !== "string" ||
    !Number.isFinite(Number(submission.timestamp))
  ) {
    throw new AppError(
      "LeetCode returned an invalid accepted submission response",
      502,
      "LEETCODE_INVALID_RESPONSE"
    );
  }

  const titleSlug = submission.titleSlug.trim();
  const title = question?.title || submission.title;

  if (!titleSlug || typeof title !== "string" || title.trim().length === 0) {
    throw new AppError(
      "LeetCode returned an invalid solved problem response",
      502,
      "LEETCODE_INVALID_RESPONSE"
    );
  }

  return {
    userId,
    contestId: null,
    platform: LEETCODE_PLATFORM,
    externalId: titleSlug,
    name: title,
    url: `https://leetcode.com/problems/${titleSlug}/`,
    tags: normalizeTopicTags(question?.topicTags),
    difficulty: typeof question?.difficulty === "string" ? question.difficulty : null,
    rating: null,
    solvedAt: new Date(Number(submission.timestamp) * 1000),
  };
}

async function syncLeetCodeSolvedProblems(userId, recentAcceptedSubmissions) {
  const uniqueSubmissions = new Map();
  const results = {
    processed: 0,
    upserted: 0,
    failed: 0,
  };

  for (const submission of recentAcceptedSubmissions) {
    if (!submission || typeof submission.titleSlug !== "string") {
      results.failed += 1;
      continue;
    }

    const existingSubmission = uniqueSubmissions.get(submission.titleSlug);
    const submissionTimestamp = Number(submission.timestamp);
    const existingTimestamp = Number(existingSubmission?.timestamp);

    if (!existingSubmission || submissionTimestamp < existingTimestamp) {
      uniqueSubmissions.set(submission.titleSlug, submission);
    }
  }

  for (const submission of uniqueSubmissions.values()) {
    try {
      const question = await fetchLeetCodeQuestion(submission.titleSlug);
      const solvedProblem = formatLeetCodeSolvedProblem(userId, submission, question);

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

async function syncLeetCodeAnalytics(userId, username, options = {}) {
  console.log(`[LEETCODE SERVICE] Started sync for handle: ${username}`);
  const recordedAt = options.recordedAt || new Date();

  try {
    console.log(`[LEETCODE SERVICE] Fetching LeetCode analytics from API (Waiting up to 10s)...`);

    // 1. Create a 10-second timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT: LeetCode API request hung for 10 seconds (Likely blocked by Cloudflare)")), 10000)
    );

    // 2. Race the API call against the timeout
    const analytics = await Promise.race([
      fetchLeetCodeUserAnalytics(username, { recentLimit: options.recentLimit }),
      timeoutPromise
    ]);

    console.log(`[LEETCODE SERVICE] Successfully fetched analytics data. Saving to database...`);

    await syncPlatformStats(userId, analytics.solvedStats);
    console.log(`[LEETCODE SERVICE] Platform stats saved.`);

    const [ratingSnapshot, solvedProblems] = await Promise.all([
      syncLeetCodeRatingSnapshot(userId, analytics.contestRanking, recordedAt),
      syncLeetCodeSolvedProblems(userId, analytics.recentAcceptedSubmissions),
    ]);

    console.log(`[LEETCODE SERVICE] Sync fully complete for ${username}`);

    return {
      username: analytics.username,
      solvedStats: analytics.solvedStats,
      submissionCalendar: analytics.submissionCalendar,
      ratingSnapshot,
      solvedProblems,
      limitations: {
        fullSolvedProblemHistory:
          "LeetCode GraphQL exposes aggregate solved counts and recent accepted submissions without scraping; full solved-problem history is not persisted.",
        submissionCalendar:
          "Submission calendar is returned by the service but not persisted because the current Prisma schema has no activity-calendar model.",
      },
    };
  } catch (error) {
    // This will finally log the error to your terminal!
    console.error(`[LEETCODE SERVICE] ERROR during sync:`, error.message);
    throw error;
  }
}
async function syncPlatformStats(userId, solvedStats) {
  // Matches your @@unique([userId, platform]) in schema.prisma
  await prisma.platformStats.upsert({
    where: { 
      userId_platform: { userId, platform: LEETCODE_PLATFORM } 
    },
    update: {
      easy: solvedStats.easySolved,
      medium: solvedStats.mediumSolved,
      hard: solvedStats.hardSolved,
    },
    create: {
      userId,
      platform: LEETCODE_PLATFORM,
      easy: solvedStats.easySolved,
      medium: solvedStats.mediumSolved,
      hard: solvedStats.hardSolved,
    },
  });
}

async function fetchLeetCodeUpcomingContests() {
  const data = await fetchLeetCodeGraphQL(LEETCODE_UPCOMING_QUERY);
  
  if (!data || !Array.isArray(data.topTwoContests)) {
    console.log("[LEETCODE SERVICE] LeetCode response missing 'topTwoContests' array");
    return [];
  }

  return data.topTwoContests.map(c => ({
    externalId: c.titleSlug,
    platform: 'LEETCODE', 
    name: c.title,
    phase: "BEFORE",
    startTime: new Date(c.startTime * 1000),
    endTime: new Date((c.startTime + c.duration) * 1000),
    durationSeconds: c.duration,
  }));
}

async function syncLeetCodeContests() {
  console.log("[LEETCODE SERVICE] Starting LeetCode upcoming contests sync...");
  
  try {
    // Force a strict 10-second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT: LeetCode Contests API request hung for 10s (Cloudflare block)")), 10000)
    );

    // Race the API call against the timeout
    const rawContests = await Promise.race([
      fetchLeetCodeUpcomingContests(),
      timeoutPromise
    ]);

    console.log("[LEETCODE SERVICE] Fetched LeetCode contests, count:", rawContests?.length);

    if (!rawContests || rawContests.length === 0) {
      console.log("[LEETCODE SERVICE] No contests returned from LeetCode API.");
      return { created: 0, updated: 0, failed: 0 };
    }

    const results = { created: 0, updated: 0, failed: 0 };

    for (const contest of rawContests) {
      try {
        await prisma.contest.upsert({
          where: { platform_externalId: { platform: 'LEETCODE', externalId: contest.externalId } },
          update: { phase: contest.phase },
          create: contest,
        });
        results.created += 1;
      } catch (err) {
        console.log("[LEETCODE SERVICE] Failed to save contest:", contest.externalId, err.message);
        results.failed += 1;
      }
    }
    
    console.log("[LEETCODE SERVICE] Contest sync complete, results:", results);
    return results;
    
  } catch (err) {
    console.error("[LEETCODE SERVICE] CRITICAL ERROR in syncLeetCodeContests:", err.message);
    return { created: 0, updated: 0, failed: 0 };
  }
}

module.exports = {
  DEFAULT_RECENT_SUBMISSION_LIMIT,
  LEETCODE_GRAPHQL_URL,
  LEETCODE_PLATFORM,
  LEETCODE_QUESTION_QUERY,
  LEETCODE_USER_ANALYTICS_QUERY,
  fetchLeetCodeGraphQL,
  fetchLeetCodeQuestion,
  fetchLeetCodeUserAnalytics,
  resetLeetCodeFetchImplementation,
  setLeetCodeFetchImplementation,
  syncLeetCodeAnalytics,
  fetchLeetCodeUpcomingContests,
  syncLeetCodeContests,
};
