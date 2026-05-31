process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ai_contest_tracker";
process.env.JWT_SECRET = "test-jwt-secret-for-contest-routes";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";

const assert = require("node:assert/strict");
const http = require("node:http");
const { afterEach, before, beforeEach, test } = require("node:test");
const { Duplex } = require("node:stream");

const app = require("../src/app");
const { prisma } = require("../src/config/prisma");
const {
  CODEFORCES_CONTESTS_URL,
  resetContestsFetchImplementation,
  setContestsFetchImplementation,
} = require("../src/services/contest.service");

let contestSequence;
let contests;
let userSequence;
let users;

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

function mockCodeforcesContestsResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
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
  contests = new Map();

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

  Object.defineProperty(prisma, "contest", {
    configurable: true,
    value: {
      create: async ({ data, select }) => {
        const key = `${data.platform}_${data.externalId}`;

        if (contests.has(key)) {
          const error = new Error("Unique constraint failed");
          error.code = "P2002";
          throw error;
        }

        contestSequence += 1;

        const contest = {
          id: `contest_${contestSequence}`,
          externalId: data.externalId,
          platform: data.platform,
          name: data.name,
          phase: data.phase,
          startTime: data.startTime,
          endTime: data.endTime,
          durationSeconds: data.durationSeconds,
          createdAt: new Date(`2026-05-31T00:02:0${contestSequence}.000Z`),
          updatedAt: new Date(`2026-05-31T00:02:0${contestSequence}.000Z`),
        };

        contests.set(key, contest);

        return selectFields(contest, select);
      },
      findUnique: async ({ where, select }) => {
        const key = `${where.platform_externalId.platform}_${where.platform_externalId.externalId}`;
        const contest = contests.get(key) || null;

        return contest ? selectFields(contest, select) : null;
      },
      findMany: async ({ where, orderBy, skip, take, select }) => {
        let allContests = Array.from(contests.values());

        if (where) {
          if (where.startTime) {
            allContests = allContests.filter((contest) => {
              const meetsGte = !where.startTime.gte || contest.startTime >= where.startTime.gte;
              const meetsLte = !where.startTime.lte || contest.startTime <= where.startTime.lte;
              return meetsGte && meetsLte;
            });
          }

          if (where.platform) {
            allContests = allContests.filter((contest) => contest.platform === where.platform);
          }
        }

        if (orderBy && orderBy[0].startTime) {
          const direction = orderBy[0].startTime;
          allContests.sort((a, b) => {
            if (direction === "asc") {
              return a.startTime - b.startTime;
            } else {
              return b.startTime - a.startTime;
            }
          });
        }

        if (skip !== undefined) {
          allContests = allContests.slice(skip);
        }

        if (take !== undefined) {
          allContests = allContests.slice(0, take);
        }

        return allContests.map((contest) => selectFields(contest, select));
      },
      count: async ({ where }) => {
        let allContests = Array.from(contests.values());

        if (where) {
          if (where.startTime) {
            allContests = allContests.filter((contest) => {
              const meetsGte = !where.startTime.gte || contest.startTime >= where.startTime.gte;
              const meetsLte = !where.startTime.lte || contest.startTime <= where.startTime.lte;
              return meetsGte && meetsLte;
            });
          }

          if (where.platform) {
            allContests = allContests.filter((contest) => contest.platform === where.platform);
          }
        }

        return allContests.length;
      },
      update: async ({ where, data, select }) => {
        const contest = contests.get(`${Array.from(contests.values()).find((c) => c.id === where.id).platform}_${Array.from(contests.values()).find((c) => c.id === where.id).externalId}`);

        if (!contest) {
          throw new Error("Contest not found");
        }

        const updated = {
          ...contest,
          ...data,
          updatedAt: new Date(),
        };

        contests.set(
          `${updated.platform}_${updated.externalId}`,
          updated
        );

        return selectFields(updated, select);
      },
    },
  });
});

beforeEach(() => {
  contestSequence = 0;
  userSequence = 0;
  contests.clear();
  users.clear();
  resetContestsFetchImplementation();
});

afterEach(() => {
  resetContestsFetchImplementation();
});

test("requires authentication before syncing contests", async () => {
  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
  });

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_TOKEN_REQUIRED");
});

test("requires authentication before fetching contests", async () => {
  const { response, payload } = await request("/api/contests");

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_TOKEN_REQUIRED");
});

test("syncs and creates new Codeforces contests", async () => {
  const token = await registerAndGetToken();

  setContestsFetchImplementation(async () =>
    mockCodeforcesContestsResponse({
      status: "OK",
      result: [
        {
          id: 1001,
          name: "Codeforces Round 900",
          phase: "FINISHED",
          startTimeSeconds: 1672531200,
          durationSeconds: 7200,
        },
        {
          id: 1002,
          name: "Codeforces Round 901",
          phase: "BEFORE",
          startTimeSeconds: 1672617600,
          durationSeconds: 7200,
        },
      ],
    })
  );

  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.created, 2);
  assert.equal(payload.data.updated, 0);
  assert.equal(payload.data.failed, 0);
});

test("updates existing contests when syncing", async () => {
  const token = await registerAndGetToken();

  contests.set("CODEFORCES_1001", {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Codeforces Round 900",
    phase: "CODING",
    startTime: new Date("2023-01-01T12:00:00Z"),
    endTime: new Date("2023-01-01T14:00:00Z"),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  setContestsFetchImplementation(async () =>
    mockCodeforcesContestsResponse({
      status: "OK",
      result: [
        {
          id: 1001,
          name: "Codeforces Round 900",
          phase: "FINISHED",
          startTimeSeconds: 1672531200,
          durationSeconds: 7200,
        },
      ],
    })
  );

  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.created, 0);
  assert.equal(payload.data.updated, 1);
});

test("fetches all contests ordered by start time", async () => {
  const token = await registerAndGetToken();

  const contest1 = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Round 900",
    phase: "FINISHED",
    startTime: new Date("2023-01-01T12:00:00Z"),
    endTime: new Date("2023-01-01T14:00:00Z"),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const contest2 = {
    id: "contest_2",
    externalId: 1002,
    platform: "CODEFORCES",
    name: "Round 901",
    phase: "BEFORE",
    startTime: new Date("2023-01-02T12:00:00Z"),
    endTime: new Date("2023-01-02T14:00:00Z"),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest1);
  contests.set("CODEFORCES_1002", contest2);

  const { response, payload } = await request("/api/contests", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.length, 2);
  assert.equal(payload.data[0].externalId, 1001);
  assert.equal(payload.data[1].externalId, 1002);
});

test("handles Codeforces API failure during sync", async () => {
  const token = await registerAndGetToken();

  setContestsFetchImplementation(async () =>
    mockCodeforcesContestsResponse(
      { status: "FAILED", comment: "Server unavailable" },
      500
    )
  );

  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "CONTESTS_API_ERROR");
});

test("handles Codeforces network failure during sync", async () => {
  const token = await registerAndGetToken();

  setContestsFetchImplementation(async () => {
    throw new Error("network down");
  });

  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "CONTESTS_API_UNAVAILABLE");
});

test("handles Codeforces rate limiting during sync", async () => {
  const token = await registerAndGetToken();

  setContestsFetchImplementation(async () =>
    mockCodeforcesContestsResponse({ status: "OK", result: [] }, 429)
  );

  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 429);
  assert.equal(payload.error.code, "CONTESTS_RATE_LIMITED");
});

test("handles invalid Codeforces JSON during sync", async () => {
  const token = await registerAndGetToken();

  setContestsFetchImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("Invalid JSON");
    },
  }));

  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "CONTESTS_INVALID_RESPONSE");
});

test("filters out contests with invalid phases", async () => {
  const token = await registerAndGetToken();

  setContestsFetchImplementation(async () =>
    mockCodeforcesContestsResponse({
      status: "OK",
      result: [
        {
          id: 1001,
          name: "Valid Contest",
          phase: "FINISHED",
          startTimeSeconds: 1672531200,
          durationSeconds: 7200,
        },
        {
          id: 1002,
          name: "Invalid Contest",
          phase: "UNKNOWN_PHASE",
          startTimeSeconds: 1672617600,
          durationSeconds: 7200,
        },
      ],
    })
  );

  const { response, payload } = await request("/api/contests/sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.created, 1);
  assert.equal(payload.data.failed, 0);
});

test("requires authentication for upcoming contests", async () => {
  const { response, payload } = await request("/api/contests/upcoming");

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_TOKEN_REQUIRED");
});

test("fetches upcoming contests with defaults (page=1, limit=20, days=30)", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const contest1 = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Round 901",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const contest2 = {
    id: "contest_2",
    externalId: 1002,
    platform: "CODEFORCES",
    name: "Round 902",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest1);
  contests.set("CODEFORCES_1002", contest2);

  const { response, payload } = await request("/api/contests/upcoming", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.length, 2);
  assert.equal(payload.pagination.page, 1);
  assert.equal(payload.pagination.limit, 20);
  assert.equal(payload.pagination.total, 2);
  assert.equal(payload.pagination.totalPages, 1);
});

test("filters upcoming contests by platform", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const contest1 = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "CF Round 901",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const contest2 = {
    id: "contest_2",
    externalId: 2001,
    platform: "LEETCODE",
    name: "LC Biweekly 99",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 5400 * 1000),
    durationSeconds: 5400,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest1);
  contests.set("LEETCODE_2001", contest2);

  const { response, payload } = await request("/api/contests/upcoming?platform=CODEFORCES", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].platform, "CODEFORCES");
  assert.equal(payload.pagination.total, 1);
});

test("respects custom page and limit parameters", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  for (let i = 1; i <= 5; i++) {
    const contest = {
      id: `contest_${i}`,
      externalId: 1000 + i,
      platform: "CODEFORCES",
      name: `Round ${900 + i}`,
      phase: "BEFORE",
      startTime: new Date(now.getTime() + i * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + i * 24 * 60 * 60 * 1000 + 7200 * 1000),
      durationSeconds: 7200,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    contests.set(`CODEFORCES_${1000 + i}`, contest);
  }

  const { response, payload } = await request("/api/contests/upcoming?page=2&limit=2", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.length, 2);
  assert.equal(payload.pagination.page, 2);
  assert.equal(payload.pagination.limit, 2);
  assert.equal(payload.pagination.total, 5);
  assert.equal(payload.pagination.totalPages, 3);
});

test("filters by days parameter", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const contest1 = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Round 901",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const contest2 = {
    id: "contest_2",
    externalId: 1002,
    platform: "CODEFORCES",
    name: "Round 902",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest1);
  contests.set("CODEFORCES_1002", contest2);

  const { response, payload } = await request("/api/contests/upcoming?days=30", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].externalId, 1001);
  assert.equal(payload.pagination.total, 1);
});

test("excludes past contests", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const pastContest = {
    id: "contest_past",
    externalId: 1000,
    platform: "CODEFORCES",
    name: "Old Round",
    phase: "FINISHED",
    startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const futureContest = {
    id: "contest_future",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Upcoming Round",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1000", pastContest);
  contests.set("CODEFORCES_1001", futureContest);

  const { response, payload } = await request("/api/contests/upcoming", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].externalId, 1001);
});

test("sorts contests by startTime ascending", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const contest1 = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Round 901",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const contest2 = {
    id: "contest_2",
    externalId: 1002,
    platform: "CODEFORCES",
    name: "Round 902",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest1);
  contests.set("CODEFORCES_1002", contest2);

  const { response, payload } = await request("/api/contests/upcoming", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data[0].externalId, 1002);
  assert.equal(payload.data[1].externalId, 1001);
});

test("returns validation error for invalid page", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/contests/upcoming?page=invalid", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert(Array.isArray(payload.error.details));
  assert(payload.error.details.some((detail) => detail.field === "page"));
});

test("returns validation error for limit exceeding max", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/contests/upcoming?limit=150", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert(Array.isArray(payload.error.details));
  assert(payload.error.details.some((detail) => detail.field === "limit"));
});

test("returns validation error for invalid days", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/contests/upcoming?days=invalid", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert(Array.isArray(payload.error.details));
  assert(payload.error.details.some((detail) => detail.field === "days"));
});

test("returns validation error for invalid platform", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/contests/upcoming?platform=INVALID", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert(Array.isArray(payload.error.details));
  assert(payload.error.details.some((detail) => detail.field === "platform"));
});

test("returns empty results with correct pagination when no contests match", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const contest = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Round 901",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest);

  const { response, payload } = await request("/api/contests/upcoming?platform=LEETCODE", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.length, 0);
  assert.equal(payload.pagination.total, 0);
  assert.equal(payload.pagination.totalPages, 0);
});

test("handles limit=0 as invalid", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/contests/upcoming?limit=0", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("handles page=0 as invalid", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/contests/upcoming?page=0", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
});

test("accepts limit=100 (max allowed)", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const contest = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "Round 901",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest);

  const { response, payload } = await request("/api/contests/upcoming?limit=100", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.pagination.limit, 100);
});

test("combines platform and days filters", async () => {
  const token = await registerAndGetToken();
  const now = new Date();

  const contest1 = {
    id: "contest_1",
    externalId: 1001,
    platform: "CODEFORCES",
    name: "CF Round 901",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const contest2 = {
    id: "contest_2",
    externalId: 2001,
    platform: "LEETCODE",
    name: "LC Biweekly 99",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 5400 * 1000),
    durationSeconds: 5400,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const contest3 = {
    id: "contest_3",
    externalId: 1002,
    platform: "CODEFORCES",
    name: "CF Round 902",
    phase: "BEFORE",
    startTime: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
    endTime: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000 + 7200 * 1000),
    durationSeconds: 7200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contests.set("CODEFORCES_1001", contest1);
  contests.set("LEETCODE_2001", contest2);
  contests.set("CODEFORCES_1002", contest3);

  const { response, payload } = await request("/api/contests/upcoming?platform=CODEFORCES&days=30", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].platform, "CODEFORCES");
  assert.equal(payload.data[0].externalId, 1001);
  assert.equal(payload.pagination.total, 1);
});
