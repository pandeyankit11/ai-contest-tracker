process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ai_contest_tracker";
process.env.JWT_SECRET = "test-jwt-secret-for-codeforces-routes";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";

const assert = require("node:assert/strict");
const http = require("node:http");
const { afterEach, before, beforeEach, test } = require("node:test");
const { Duplex } = require("node:stream");

const app = require("../src/app");
const { prisma } = require("../src/config/prisma");
const {
  CODEFORCES_USER_INFO_URL,
  resetCodeforcesFetchImplementation,
  setCodeforcesFetchImplementation,
} = require("../src/services/codeforces.service");

let accountSequence;
let accounts;
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

function mockCodeforcesResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function mockCodeforcesInvalidJsonResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("Invalid JSON");
    },
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

async function addPlatformAccount(token, platform, handle) {
  return request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: {
      platform,
      handle,
    },
  });
}

before(() => {
  users = new Map();
  accounts = new Map();

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

  Object.defineProperty(prisma, "contestAccount", {
    configurable: true,
    value: {
      create: async ({ data, select }) => {
        const duplicate = Array.from(accounts.values()).find(
          (account) =>
            account.userId === data.userId && account.platform === data.platform
        );

        if (duplicate) {
          const error = new Error("Unique constraint failed");
          error.code = "P2002";
          throw error;
        }

        accountSequence += 1;

        const account = {
          id: `account_${accountSequence}`,
          userId: data.userId,
          platform: data.platform,
          handle: data.handle,
          createdAt: new Date(`2026-05-31T00:01:0${accountSequence}.000Z`),
        };

        accounts.set(account.id, account);

        return selectFields(account, select);
      },
      findFirst: async ({ where, select }) => {
        const account = Array.from(accounts.values()).find(
          (storedAccount) =>
            storedAccount.userId === where.userId &&
            storedAccount.platform === where.platform
        );

        return account ? selectFields(account, select) : null;
      },
      findMany: async ({ where, select }) => {
        const matchingAccounts = Array.from(accounts.values()).filter(
          (account) => account.userId === where.userId
        );

        return matchingAccounts.map((account) => selectFields(account, select));
      },
      deleteMany: async ({ where }) => {
        const existing = accounts.get(where.id);

        if (!existing || existing.userId !== where.userId) {
          return { count: 0 };
        }

        accounts.delete(where.id);
        return { count: 1 };
      },
    },
  });
});

beforeEach(() => {
  accountSequence = 0;
  userSequence = 0;
  accounts.clear();
  users.clear();
  resetCodeforcesFetchImplementation();
});

afterEach(() => {
  resetCodeforcesFetchImplementation();
});

test("health endpoint remains unchanged", async () => {
  const { response, payload } = await request("/api/health");

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    status: "ok",
    message: "AI Contest Tracker Backend Running",
  });
});

test("requires authentication before fetching a Codeforces profile", async () => {
  const { response, payload } = await request("/api/codeforces/profile");

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_TOKEN_REQUIRED");
});

test("returns 404 when the logged-in user has no Codeforces account", async () => {
  const token = await registerAndGetToken();
  let fetchCalled = false;

  setCodeforcesFetchImplementation(async () => {
    fetchCalled = true;
    return mockCodeforcesResponse({ status: "OK", result: [] });
  });

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 404);
  assert.equal(payload.error.code, "CODEFORCES_ACCOUNT_NOT_FOUND");
  assert.equal(fetchCalled, false);
});

test("fetches and returns the logged-in user's Codeforces profile", async () => {
  const token = await registerAndGetToken();
  await addPlatformAccount(token, "CODEFORCES", "tourist");

  let requestedUrl;
  let requestedOptions;

  setCodeforcesFetchImplementation(async (url, options) => {
    requestedUrl = url;
    requestedOptions = options;

    return mockCodeforcesResponse({
      status: "OK",
      result: [
        {
          handle: "tourist",
          rating: 3859,
          maxRating: 3979,
          rank: "legendary grandmaster",
          maxRank: "legendary grandmaster",
          contribution: 100,
        },
      ],
    });
  });

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(requestedUrl, `${CODEFORCES_USER_INFO_URL}?handles=tourist`);
  assert.equal(requestedOptions.method, "GET");
  assert.deepEqual(payload, {
    success: true,
    data: {
      handle: "tourist",
      rating: 3859,
      maxRating: 3979,
      rank: "legendary grandmaster",
      maxRank: "legendary grandmaster",
      contribution: 100,
    },
  });
});

test("rejects a stored Codeforces account with a missing handle", async () => {
  const token = await registerAndGetToken();
  accounts.set("account_missing_handle", {
    id: "account_missing_handle",
    userId: "user_1",
    platform: "CODEFORCES",
    handle: "",
    createdAt: new Date("2026-05-31T00:01:00.000Z"),
  });

  let fetchCalled = false;
  setCodeforcesFetchImplementation(async () => {
    fetchCalled = true;
    return mockCodeforcesResponse({ status: "OK", result: [] });
  });

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "CODEFORCES_HANDLE_MISSING");
  assert.equal(fetchCalled, false);
});

test("handles Codeforces API failure", async () => {
  const token = await registerAndGetToken();
  await addPlatformAccount(token, "CODEFORCES", "tourist");

  setCodeforcesFetchImplementation(async () =>
    mockCodeforcesResponse({ status: "FAILED", comment: "Server unavailable" }, 500)
  );

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "CODEFORCES_API_ERROR");
});

test("handles Codeforces network failure", async () => {
  const token = await registerAndGetToken();
  await addPlatformAccount(token, "CODEFORCES", "tourist");

  setCodeforcesFetchImplementation(async () => {
    throw new Error("network down");
  });

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "CODEFORCES_API_UNAVAILABLE");
});

test("handles Codeforces rate limiting", async () => {
  const token = await registerAndGetToken();
  await addPlatformAccount(token, "CODEFORCES", "tourist");

  setCodeforcesFetchImplementation(async () =>
    mockCodeforcesResponse({ status: "FAILED", comment: "Call limit exceeded" }, 200)
  );

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 429);
  assert.equal(payload.error.code, "CODEFORCES_RATE_LIMITED");
});

test("handles invalid Codeforces JSON", async () => {
  const token = await registerAndGetToken();
  await addPlatformAccount(token, "CODEFORCES", "tourist");

  setCodeforcesFetchImplementation(async () => mockCodeforcesInvalidJsonResponse());

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "CODEFORCES_INVALID_RESPONSE");
});

test("handles invalid Codeforces profile payload", async () => {
  const token = await registerAndGetToken();
  await addPlatformAccount(token, "CODEFORCES", "tourist");

  setCodeforcesFetchImplementation(async () =>
    mockCodeforcesResponse({ status: "OK", result: [] })
  );

  const { response, payload } = await request("/api/codeforces/profile", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "CODEFORCES_INVALID_RESPONSE");
});
