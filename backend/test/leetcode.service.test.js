process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ai_contest_tracker";
process.env.JWT_SECRET = "test-jwt-secret-for-leetcode-service";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";

const assert = require("node:assert/strict");
const { afterEach, before, beforeEach, test } = require("node:test");

const { prisma } = require("../src/config/prisma");
const {
  LEETCODE_GRAPHQL_URL,
  LEETCODE_QUESTION_QUERY,
  LEETCODE_USER_ANALYTICS_QUERY,
  resetLeetCodeFetchImplementation,
  setLeetCodeFetchImplementation,
  syncLeetCodeAnalytics,
} = require("../src/services/leetcode.service");

let ratingSnapshotSequence;
let ratingSnapshots;
let solvedProblemSequence;
let solvedProblems;

function selectFields(record, select) {
  if (!select) {
    return { ...record };
  }

  return Object.entries(select).reduce((selected, [field, include]) => {
    if (include) {
      selected[field] = record[field];
    }

    return selected;
  }, {});
}

function mockLeetCodeResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function parseGraphQLBody(options) {
  return JSON.parse(options.body);
}

before(() => {
  ratingSnapshots = new Map();
  solvedProblems = new Map();

  Object.defineProperty(prisma, "ratingSnapshot", {
    configurable: true,
    value: {
      upsert: async ({ where, update, create, select }) => {
        const uniqueWhere = where.userId_platform_recordedAt;
        const key = [
          uniqueWhere.userId,
          uniqueWhere.platform,
          uniqueWhere.recordedAt.toISOString(),
        ].join("_");

        let snapshot = ratingSnapshots.get(key);

        if (snapshot) {
          snapshot = {
            ...snapshot,
            ...update,
          };
        } else {
          ratingSnapshotSequence += 1;
          snapshot = {
            id: `leetcode_rating_snapshot_${ratingSnapshotSequence}`,
            userId: create.userId,
            platform: create.platform,
            rating: create.rating,
            maxRating: create.maxRating,
            rank: create.rank,
            recordedAt: create.recordedAt,
            createdAt: new Date(`2026-06-01T00:01:0${ratingSnapshotSequence}.000Z`),
          };
        }

        ratingSnapshots.set(key, snapshot);

        return selectFields(snapshot, select);
      },
    },
  });

  Object.defineProperty(prisma, "solvedProblem", {
    configurable: true,
    value: {
      upsert: async ({ where, update, create, select }) => {
        const uniqueWhere = where.userId_platform_externalId;
        const key = [
          uniqueWhere.userId,
          uniqueWhere.platform,
          uniqueWhere.externalId,
        ].join("_");

        let solvedProblem = solvedProblems.get(key);

        if (solvedProblem) {
          solvedProblem = {
            ...solvedProblem,
            ...update,
          };
        } else {
          solvedProblemSequence += 1;
          solvedProblem = {
            id: `leetcode_solved_problem_${solvedProblemSequence}`,
            userId: create.userId,
            contestId: create.contestId,
            platform: create.platform,
            externalId: create.externalId,
            name: create.name,
            url: create.url,
            tags: create.tags,
            difficulty: create.difficulty,
            rating: create.rating,
            solvedAt: create.solvedAt,
            createdAt: new Date(`2026-06-01T00:02:0${solvedProblemSequence}.000Z`),
            updatedAt: new Date(`2026-06-01T00:02:0${solvedProblemSequence}.000Z`),
          };
        }

        solvedProblems.set(key, solvedProblem);

        return selectFields(solvedProblem, select);
      },
    },
  });
});

beforeEach(() => {
  ratingSnapshotSequence = 0;
  solvedProblemSequence = 0;
  ratingSnapshots.clear();
  solvedProblems.clear();
  resetLeetCodeFetchImplementation();
});

afterEach(() => {
  resetLeetCodeFetchImplementation();
});

test("syncs LeetCode analytics using GraphQL and existing analytics models", async () => {
  const graphqlCalls = [];

  setLeetCodeFetchImplementation(async (url, options) => {
    graphqlCalls.push({ url, body: parseGraphQLBody(options) });
    assert.equal(url, LEETCODE_GRAPHQL_URL);
    assert.equal(options.method, "POST");

    const { query, variables } = parseGraphQLBody(options);

    if (query === LEETCODE_USER_ANALYTICS_QUERY) {
      assert.deepEqual(variables, {
        username: "alice",
        recentLimit: 100,
      });

      return mockLeetCodeResponse({
        data: {
          matchedUser: {
            username: "alice",
            submitStats: {
              acSubmissionNum: [
                { difficulty: "All", count: 42, submissions: 50 },
                { difficulty: "Easy", count: 20, submissions: 22 },
                { difficulty: "Medium", count: 17, submissions: 21 },
                { difficulty: "Hard", count: 5, submissions: 7 },
              ],
            },
            submissionCalendar: "{\"1775000100\":2,\"1775086500\":1}",
          },
          recentAcSubmissionList: [
            {
              id: "submission_2",
              title: "Two Sum",
              titleSlug: "two-sum",
              timestamp: "1775000200",
            },
            {
              id: "submission_1",
              title: "Two Sum",
              titleSlug: "two-sum",
              timestamp: "1775000100",
            },
            {
              id: "submission_3",
              title: "Binary Tree Inorder Traversal",
              titleSlug: "binary-tree-inorder-traversal",
              timestamp: "1775086500",
            },
          ],
          userContestRanking: {
            attendedContestsCount: 12,
            rating: 1842.65,
            globalRanking: 12345,
            totalParticipants: 500000,
            topPercentage: 8.5,
          },
        },
      });
    }

    if (query === LEETCODE_QUESTION_QUERY && variables.titleSlug === "two-sum") {
      return mockLeetCodeResponse({
        data: {
          question: {
            questionId: "1",
            title: "Two Sum",
            titleSlug: "two-sum",
            difficulty: "Easy",
            topicTags: [
              { name: "Array", slug: "array" },
              { name: "Hash Table", slug: "hash-table" },
            ],
          },
        },
      });
    }

    if (
      query === LEETCODE_QUESTION_QUERY &&
      variables.titleSlug === "binary-tree-inorder-traversal"
    ) {
      return mockLeetCodeResponse({
        data: {
          question: {
            questionId: "94",
            title: "Binary Tree Inorder Traversal",
            titleSlug: "binary-tree-inorder-traversal",
            difficulty: "Easy",
            topicTags: [
              { name: "Stack", slug: "stack" },
              { name: "Tree", slug: "tree" },
            ],
          },
        },
      });
    }

    throw new Error(`Unexpected GraphQL query: ${query}`);
  });

  const firstResult = await syncLeetCodeAnalytics("user_1", "alice", {
    recordedAt: new Date("2026-06-01T10:00:00.000Z"),
  });
  const secondResult = await syncLeetCodeAnalytics("user_1", "alice", {
    recordedAt: new Date("2026-06-01T10:00:00.000Z"),
  });
  const storedRatingSnapshots = Array.from(ratingSnapshots.values());
  const storedSolvedProblems = Array.from(solvedProblems.values()).sort((left, right) =>
    left.externalId.localeCompare(right.externalId)
  );

  assert.equal(graphqlCalls.length, 6);
  assert.deepEqual(firstResult.solvedStats, {
    totalSolved: 42,
    easySolved: 20,
    mediumSolved: 17,
    hardSolved: 5,
  });
  assert.deepEqual(firstResult.submissionCalendar, {
    1775000100: 2,
    1775086500: 1,
  });
  assert.deepEqual(firstResult.ratingSnapshot, {
    processed: 1,
    upserted: 1,
    failed: 0,
  });
  assert.deepEqual(firstResult.solvedProblems, {
    processed: 2,
    upserted: 2,
    failed: 0,
  });
  assert.deepEqual(secondResult.ratingSnapshot, {
    processed: 1,
    upserted: 1,
    failed: 0,
  });
  assert.deepEqual(secondResult.solvedProblems, {
    processed: 2,
    upserted: 2,
    failed: 0,
  });
  assert.equal(ratingSnapshots.size, 1);
  assert.equal(solvedProblems.size, 2);
  assert.deepEqual(
    storedRatingSnapshots.map((snapshot) => ({
      userId: snapshot.userId,
      platform: snapshot.platform,
      rating: snapshot.rating,
      maxRating: snapshot.maxRating,
      rank: snapshot.rank,
      recordedAt: snapshot.recordedAt.toISOString(),
    })),
    [
      {
        userId: "user_1",
        platform: "LEETCODE",
        rating: 1843,
        maxRating: 1843,
        rank: "12345",
        recordedAt: "2026-06-01T10:00:00.000Z",
      },
    ]
  );
  assert.deepEqual(
    storedSolvedProblems.map((problem) => ({
      userId: problem.userId,
      platform: problem.platform,
      externalId: problem.externalId,
      name: problem.name,
      tags: problem.tags,
      difficulty: problem.difficulty,
      rating: problem.rating,
      solvedAt: problem.solvedAt.toISOString(),
      url: problem.url,
    })),
    [
      {
        userId: "user_1",
        platform: "LEETCODE",
        externalId: "binary-tree-inorder-traversal",
        name: "Binary Tree Inorder Traversal",
        tags: ["Stack", "Tree"],
        difficulty: "Easy",
        rating: null,
        solvedAt: "2026-04-01T23:35:00.000Z",
        url: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
      },
      {
        userId: "user_1",
        platform: "LEETCODE",
        externalId: "two-sum",
        name: "Two Sum",
        tags: ["Array", "Hash Table"],
        difficulty: "Easy",
        rating: null,
        solvedAt: "2026-03-31T23:35:00.000Z",
        url: "https://leetcode.com/problems/two-sum/",
      },
    ]
  );
});

test("returns aggregate LeetCode analytics when no rating or recent solved problems are available", async () => {
  setLeetCodeFetchImplementation(async (_url, options) => {
    const { query } = parseGraphQLBody(options);

    assert.equal(query, LEETCODE_USER_ANALYTICS_QUERY);

    return mockLeetCodeResponse({
      data: {
        matchedUser: {
          username: "beginner",
          submitStats: {
            acSubmissionNum: [
              { difficulty: "All", count: 3, submissions: 3 },
              { difficulty: "Easy", count: 3, submissions: 3 },
              { difficulty: "Medium", count: 0, submissions: 0 },
              { difficulty: "Hard", count: 0, submissions: 0 },
            ],
          },
          submissionCalendar: "{}",
        },
        recentAcSubmissionList: [],
        userContestRanking: null,
      },
    });
  });

  const result = await syncLeetCodeAnalytics("user_1", "beginner", {
    recordedAt: new Date("2026-06-01T10:00:00.000Z"),
  });

  assert.deepEqual(result.solvedStats, {
    totalSolved: 3,
    easySolved: 3,
    mediumSolved: 0,
    hardSolved: 0,
  });
  assert.deepEqual(result.ratingSnapshot, {
    processed: 0,
    upserted: 0,
    failed: 0,
  });
  assert.deepEqual(result.solvedProblems, {
    processed: 0,
    upserted: 0,
    failed: 0,
  });
  assert.equal(ratingSnapshots.size, 0);
  assert.equal(solvedProblems.size, 0);
});

test("rejects missing LeetCode usernames before calling GraphQL", async () => {
  let fetchCalled = false;

  setLeetCodeFetchImplementation(async () => {
    fetchCalled = true;
    return mockLeetCodeResponse({ data: {} });
  });

  await assert.rejects(
    () => syncLeetCodeAnalytics("user_1", ""),
    (error) => error.code === "LEETCODE_USERNAME_MISSING"
  );
  assert.equal(fetchCalled, false);
});
