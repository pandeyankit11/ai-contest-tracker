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
  if (typeof fetchImplementation !== "function") {
    throw new AppError(
      "LeetCode API client is not available",
      502,
      "LEETCODE_API_UNAVAILABLE"
    );
  }

  let response;

  try {
    response = await fetchImplementation(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
  } catch (_error) {
    throw new AppError(
      "Unable to reach LeetCode API",
      502,
      "LEETCODE_API_UNAVAILABLE"
    );
  }

  assertValidFetchResponse(response);

  if (response.status === 429) {
    throw new AppError(
      "LeetCode API rate limit exceeded",
      429,
      "LEETCODE_RATE_LIMITED"
    );
  }

  if (!response.ok) {
    throw new AppError("LeetCode API request failed", 502, "LEETCODE_API_ERROR");
  }

  let payload;

  try {
    payload = await response.json();
  } catch (_error) {
    throw new AppError(
      "LeetCode returned an invalid JSON response",
      502,
      "LEETCODE_INVALID_RESPONSE"
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new AppError(
      "LeetCode returned an invalid GraphQL response",
      502,
      "LEETCODE_INVALID_RESPONSE"
    );
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new AppError(getGraphQLErrorMessage(payload.errors), 502, "LEETCODE_API_ERROR");
  }

  return payload.data;
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
  const recordedAt = options.recordedAt || new Date();
  const analytics = await fetchLeetCodeUserAnalytics(username, {
    recentLimit: options.recentLimit,
  });
  const [ratingSnapshot, solvedProblems] = await Promise.all([
    syncLeetCodeRatingSnapshot(userId, analytics.contestRanking, recordedAt),
    syncLeetCodeSolvedProblems(userId, analytics.recentAcceptedSubmissions),
  ]);

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
};
