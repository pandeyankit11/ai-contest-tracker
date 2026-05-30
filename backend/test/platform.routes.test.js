process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ai_contest_tracker";
process.env.JWT_SECRET = "test-jwt-secret-for-platform-routes";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";

const assert = require("node:assert/strict");
const http = require("node:http");
const { before, beforeEach, test } = require("node:test");
const { Duplex } = require("node:stream");
const bcrypt = require("bcrypt");

const app = require("../src/app");
const { prisma } = require("../src/config/prisma");

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

function sortAccountsForResponse(records) {
  return [...records].sort((left, right) => {
    const byDate = right.createdAt.getTime() - left.createdAt.getTime();

    if (byDate !== 0) {
      return byDate;
    }

    return right.id.localeCompare(left.id);
  });
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
      findMany: async ({ where, select }) => {
        const matchingAccounts = sortAccountsForResponse(
          Array.from(accounts.values()).filter(
            (account) => account.userId === where.userId
          )
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
});

test("health endpoint remains unchanged", async () => {
  const { response, payload } = await request("/api/health");

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    status: "ok",
    message: "AI Contest Tracker Backend Running",
  });
});

test("auth registration still hashes passwords and returns a JWT", async () => {
  const { response, payload } = await request("/api/auth/register", {
    method: "POST",
    body: {
      email: "USER@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    },
  });

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.user.email, "user@example.com");
  assert.equal(payload.data.user.password, undefined);
  assert.ok(payload.data.token);
  assert.equal(await bcrypt.compare("Password123", users.get("user@example.com").password), true);
});

test("requires authentication before listing platform accounts", async () => {
  const { response, payload } = await request("/api/platforms");

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_TOKEN_REQUIRED");
});

test("adds a platform account for the logged-in user", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: {
      platform: "codeforces",
      handle: "tourist",
    },
  });

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.account.userId, "user_1");
  assert.equal(payload.data.account.platform, "CODEFORCES");
  assert.equal(payload.data.account.handle, "tourist");
});

test("rejects invalid platform account input", async () => {
  const token = await registerAndGetToken();

  const { response, payload } = await request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: {
      platform: "atcoder",
      handle: "bad handle",
    },
  });

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert.ok(payload.error.details.platform);
  assert.ok(payload.error.details.handle);
});

test("prevents duplicate platform accounts for the same user", async () => {
  const token = await registerAndGetToken();

  await request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: {
      platform: "CODEFORCES",
      handle: "tourist",
    },
  });

  const { response, payload } = await request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: {
      platform: "CODEFORCES",
      handle: "another_handle",
    },
  });

  assert.equal(response.status, 409);
  assert.equal(payload.error.code, "PLATFORM_ACCOUNT_ALREADY_EXISTS");
});

test("lists only the logged-in user's platform accounts", async () => {
  const firstToken = await registerAndGetToken("first@example.com");
  const secondToken = await registerAndGetToken("second@example.com");

  await request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${firstToken}`,
    },
    body: {
      platform: "CODEFORCES",
      handle: "first_cf",
    },
  });

  await request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secondToken}`,
    },
    body: {
      platform: "LEETCODE",
      handle: "second-lc",
    },
  });

  const { response, payload } = await request("/api/platforms", {
    headers: {
      authorization: `Bearer ${firstToken}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.accounts.length, 1);
  assert.equal(payload.data.accounts[0].userId, "user_1");
  assert.equal(payload.data.accounts[0].handle, "first_cf");
});

test("deletes only the logged-in user's platform account", async () => {
  const firstToken = await registerAndGetToken("first@example.com");
  const secondToken = await registerAndGetToken("second@example.com");

  const created = await request("/api/platforms", {
    method: "POST",
    headers: {
      authorization: `Bearer ${firstToken}`,
    },
    body: {
      platform: "CODEFORCES",
      handle: "first_cf",
    },
  });

  const forbiddenDelete = await request(
    `/api/platforms/${created.payload.data.account.id}`,
    {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${secondToken}`,
      },
    }
  );

  assert.equal(forbiddenDelete.response.status, 404);
  assert.equal(forbiddenDelete.payload.error.code, "PLATFORM_ACCOUNT_NOT_FOUND");

  const allowedDelete = await request(
    `/api/platforms/${created.payload.data.account.id}`,
    {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${firstToken}`,
      },
    }
  );

  assert.equal(allowedDelete.response.status, 204);
  assert.equal(accounts.size, 0);
});
