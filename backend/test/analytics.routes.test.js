process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ai_contest_tracker";
process.env.JWT_SECRET = "test-jwt-secret-for-analytics-routes";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";

const assert = require("node:assert/strict");
const http = require("node:http");
const { before, beforeEach, test } = require("node:test");
const { Duplex } = require("node:stream");

const app = require("../src/app");
const { prisma } = require("../src/config/prisma");

let userSequence;
let users;
let ratingSnapshots;
let solvedProblems;
let contestParticipations;

class MockSocket extends Duplex {
  constructor() {
    super();
    this.chunks = [];
    this.encrypted = false;
    this.remoteAddress = "127.0.0.1";
  }

  _read() {}

  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.from(chunk));
    callback();
  }
}

function createRequest(path, options, socket) {
  const req = new http.IncomingMessage(socket);
  req.method = options.method || "GET";
  req.url = path;
  req.headers = {
    ...(options.headers || {}),
  };
  req.body = options.body;
  req.push(null);

  return req;
}

function parseResponseBody(rawResponse) {
  const separatorIndex = rawResponse.indexOf("\r\n\r\n");

  if (separatorIndex === -1) {
    return null;
  }

  const rawBody = rawResponse.slice(separatorIndex + 4);

  return rawBody ? JSON.parse(rawBody) : null;
}

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const socket = new MockSocket();
    const req = createRequest(path, options, socket);
    const res = new http.ServerResponse(req);

    res.assignSocket(socket);
    res.on("error", reject);
    socket.on("error", reject);
    res.on("finish", () => {
      const rawResponse = Buffer.concat(socket.chunks).toString("utf8");

      resolve({
        response: {
          status: res.statusCode,
          headers: res.getHeaders(),
        },
        payload: parseResponseBody(rawResponse),
      });
    });

    app.handle(req, res, (error) => {
      if (error) {
        reject(error);
      }
    });
  });
}

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

async function registerAndGetToken(email = "user@example.com") {
  const { payload } = await request("/api/auth/register", {
    method: "POST",
    body: {
      email,
      password: "Password123",
      passwordConfirmation: "Password123",
    },
  });

  return payload.data.token;
}

before(() => {
  users = new Map();
  ratingSnapshots = new Map();
  solvedProblems = new Map();
  contestParticipations = new Map();

  Object.defineProperty(prisma, "user", {
    configurable: true,
    value: {
      create: async ({ data, select }) => {
        if (users.has(data.email)) {
          const error = new Error("Unique constraint failed");
          error.code = "P2002";
          throw error;
        }

        userSequence += 1;

        const user = {
          id: `user_${userSequence}`,
          email: data.email,
          password: data.password,
          createdAt: new Date(`2026-05-31T00:00:0${userSequence}.000Z`),
        };

        users.set(user.email, user);

        return selectFields(user, select);
      },
      findUnique: async ({ where, select }) => {
        let user = null;

        if (where.email) {
          user = users.get(where.email) || null;
        }

        if (where.id) {
          user =
            Array.from(users.values()).find((storedUser) => storedUser.id === where.id) ||
            null;
        }

        return user ? selectFields(user, select) : null;
      },
    },
  });

  Object.defineProperty(prisma, "ratingSnapshot", {
    configurable: true,
    value: {
      findMany: async ({ where, orderBy, select }) => {
        let results = Array.from(ratingSnapshots.values()).filter(
          (snapshot) => snapshot.userId === where.userId
        );

        if (orderBy && Array.isArray(orderBy) && orderBy.length > 0 && orderBy[0].recordedAt) {
          results.sort((a, b) => {
            const dateComparison = b.recordedAt.getTime() - a.recordedAt.getTime();
            return orderBy[0].recordedAt === "desc" ? dateComparison : -dateComparison;
          });
        }

        return results.map((snapshot) => {
          if (!select) {
            return snapshot;
          }
          return selectFields(snapshot, select);
        });
      },
      create: async ({ data, select }) => {
        const id = `snapshot_${Date.now()}_${Math.random()}`;
        const snapshot = {
          id,
          userId: data.userId,
          platform: data.platform,
          rating: data.rating,
          maxRating: data.maxRating,
          recordedAt: data.recordedAt,
          createdAt: new Date(),
        };
        ratingSnapshots.set(id, snapshot);
        if (!select) {
          return snapshot;
        }
        return selectFields(snapshot, select);
      },
    },
  });

  Object.defineProperty(prisma, "solvedProblem", {
    configurable: true,
    value: {
      findMany: async ({ where, orderBy, select }) => {
        let results = Array.from(solvedProblems.values()).filter(
          (problem) => problem.userId === where.userId
        );

        if (orderBy && orderBy.solvedAt) {
          results.sort((a, b) => {
            const order = orderBy.solvedAt === "asc" ? 1 : -1;
            return order * (a.solvedAt.getTime() - b.solvedAt.getTime());
          });
        }

        return results.map((problem) => {
          if (!select) {
            return problem;
          }
          return selectFields(problem, select);
        });
      },
      create: async ({ data, select }) => {
        const id = `problem_${Date.now()}_${Math.random()}`;
        const problem = {
          id,
          userId: data.userId,
          platform: data.platform,
          externalId: data.externalId,
          name: data.name,
          difficulty: data.difficulty || null,
          tags: data.tags || [],
          solvedAt: data.solvedAt,
          createdAt: new Date(),
        };
        solvedProblems.set(id, problem);
        if (!select) {
          return problem;
        }
        return selectFields(problem, select);
      },
    },
  });
});

beforeEach(() => {
  userSequence = 0;
  users.clear();
  ratingSnapshots.clear();
  solvedProblems.clear();
  contestParticipations.clear();
});

test("requires authentication before accessing analytics endpoints", async () => {
  const { response, payload } = await request("/api/analytics/rating-history");

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_TOKEN_REQUIRED");
});

test("GET /api/analytics/rating-history returns rating history grouped by platform", async () => {
  const token = await registerAndGetToken();
  const userId = "user_1";

  await prisma.ratingSnapshot.create({
    data: {
      userId,
      platform: "CODEFORCES",
      rating: 1600,
      maxRating: 1800,
      recordedAt: new Date("2026-05-31"),
    },
  });

  await prisma.ratingSnapshot.create({
    data: {
      userId,
      platform: "CODEFORCES",
      rating: 1650,
      maxRating: 1800,
      recordedAt: new Date("2026-06-01"),
    },
  });

  await prisma.ratingSnapshot.create({
    data: {
      userId,
      platform: "LEETCODE",
      rating: 1500,
      maxRating: 1500,
      recordedAt: new Date("2026-05-31"),
    },
  });

  const { response, payload } = await request("/api/analytics/rating-history", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.CODEFORCES);
  assert.ok(payload.data.LEETCODE);
  assert.equal(payload.data.CODEFORCES.latestRating, 1650);
  assert.equal(payload.data.CODEFORCES.maxRating, 1800);
  assert.equal(payload.data.LEETCODE.latestRating, 1500);
  assert.equal(payload.data.CODEFORCES.history.length, 2);
  assert.equal(payload.data.LEETCODE.history.length, 1);
});

test("GET /api/analytics/difficulty-breakdown returns solved problems by difficulty", async () => {
  const token = await registerAndGetToken();
  const userId = "user_1";

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "1",
      name: "Easy Problem",
      difficulty: "easy",
      solvedAt: new Date(),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "2",
      name: "Medium Problem 1",
      difficulty: "medium",
      solvedAt: new Date(),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "3",
      name: "Medium Problem 2",
      difficulty: "medium",
      solvedAt: new Date(),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "CODEFORCES",
      externalId: "cf1",
      name: "CF Hard",
      difficulty: "hard",
      solvedAt: new Date(),
    },
  });

  const { response, payload } = await request("/api/analytics/difficulty-breakdown", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.LEETCODE);
  assert.ok(payload.data.CODEFORCES);
  assert.equal(payload.data.LEETCODE.easy, 1);
  assert.equal(payload.data.LEETCODE.medium, 2);
  assert.equal(payload.data.CODEFORCES.hard, 1);
});

test("GET /api/analytics/topic-breakdown returns tag counts grouped by platform", async () => {
  const token = await registerAndGetToken();
  const userId = "user_1";

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "1",
      name: "Problem 1",
      tags: ["array", "sorting"],
      solvedAt: new Date(),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "2",
      name: "Problem 2",
      tags: ["array", "dp"],
      solvedAt: new Date(),
    },
  });

  const { response, payload } = await request("/api/analytics/topic-breakdown", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.LEETCODE);
  assert.equal(payload.data.LEETCODE.array, 2);
  assert.equal(payload.data.LEETCODE.sorting, 1);
  assert.equal(payload.data.LEETCODE.dp, 1);
});

test("GET /api/analytics/activity returns daily solved counts", async () => {
  const token = await registerAndGetToken();
  const userId = "user_1";

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "1",
      name: "Problem 1",
      solvedAt: new Date("2026-05-31"),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "2",
      name: "Problem 2",
      solvedAt: new Date("2026-05-31"),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "CODEFORCES",
      externalId: "cf1",
      name: "CF Problem",
      solvedAt: new Date("2026-06-01"),
    },
  });

  const { response, payload } = await request("/api/analytics/activity", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.LEETCODE);
  assert.ok(payload.data.CODEFORCES);
  assert.equal(payload.data.LEETCODE["2026-05-31"], 2);
  assert.equal(payload.data.CODEFORCES["2026-06-01"], 1);
});

test("GET /api/analytics/solved-trends returns cumulative solved counts over time", async () => {
  const token = await registerAndGetToken();
  const userId = "user_1";

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "1",
      name: "Problem 1",
      solvedAt: new Date("2026-05-31"),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "2",
      name: "Problem 2",
      solvedAt: new Date("2026-06-01"),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId,
      platform: "LEETCODE",
      externalId: "3",
      name: "Problem 3",
      solvedAt: new Date("2026-06-01"),
    },
  });

  const { response, payload } = await request("/api/analytics/solved-trends", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.LEETCODE);
  assert.equal(payload.data.LEETCODE.length, 2);
  assert.equal(payload.data.LEETCODE[0].date, "2026-05-31");
  assert.equal(payload.data.LEETCODE[0].count, 1);
  assert.equal(payload.data.LEETCODE[1].date, "2026-06-01");
  assert.equal(payload.data.LEETCODE[1].count, 3);
});

test("users can only access their own analytics data", async () => {
  const token1 = await registerAndGetToken("user1@example.com");
  const token2 = await registerAndGetToken("user2@example.com");

  await prisma.solvedProblem.create({
    data: {
      userId: "user_1",
      platform: "LEETCODE",
      externalId: "1",
      name: "User 1 Problem",
      difficulty: "Easy",
      solvedAt: new Date(),
    },
  });

  await prisma.solvedProblem.create({
    data: {
      userId: "user_2",
      platform: "LEETCODE",
      externalId: "2",
      name: "User 2 Problem",
      difficulty: "Medium",
      solvedAt: new Date(),
    },
  });

  const { response: response1, payload: payload1 } = await request(
    "/api/analytics/difficulty-breakdown",
    {
      headers: {
        authorization: `Bearer ${token1}`,
      },
    }
  );

  const { response: response2, payload: payload2 } = await request(
    "/api/analytics/difficulty-breakdown",
    {
      headers: {
        authorization: `Bearer ${token2}`,
      },
    }
  );

  assert.equal(response1.status, 200);
  assert.equal(response2.status, 200);

  assert.deepEqual(payload1.data, { LEETCODE: { easy: 1, medium: 0, hard: 0 } });
  assert.deepEqual(payload2.data, { LEETCODE: { easy: 0, medium: 1, hard: 0 } });
});

test("analytics endpoints return empty data for users with no activity", async () => {
  const token = await registerAndGetToken();

  const { response: rhResponse, payload: rhPayload } = await request(
    "/api/analytics/rating-history",
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );

  const { response: dbResponse, payload: dbPayload } = await request(
    "/api/analytics/difficulty-breakdown",
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );

  const { response: tbResponse, payload: tbPayload } = await request(
    "/api/analytics/topic-breakdown",
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );

  const { response: aResponse, payload: aPayload } = await request("/api/analytics/activity", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const { response: stResponse, payload: stPayload } = await request(
    "/api/analytics/solved-trends",
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );

  assert.equal(rhResponse.status, 200);
  assert.equal(dbResponse.status, 200);
  assert.equal(tbResponse.status, 200);
  assert.equal(aResponse.status, 200);
  assert.equal(stResponse.status, 200);

  assert.deepEqual(rhPayload.data, {});
  assert.deepEqual(dbPayload.data, {});
  assert.deepEqual(tbPayload.data, {});
  assert.deepEqual(aPayload.data, {});
  assert.deepEqual(stPayload.data, {});
});
