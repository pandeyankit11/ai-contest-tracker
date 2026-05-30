process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-auth-routes";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";

const assert = require("node:assert/strict");
const http = require("node:http");
const { before, beforeEach, test } = require("node:test");
const { Duplex } = require("node:stream");
const bcrypt = require("bcrypt");

const app = require("../src/app");
const { prisma } = require("../src/config/prisma");

let idSequence;
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

before(() => {
  users = new Map();

  Object.defineProperty(prisma, "user", {
    configurable: true,
    value: {
      create: async ({ data, select }) => {
        if (users.has(data.email)) {
          const error = new Error("Unique constraint failed");
          error.code = "P2002";
          throw error;
        }

        idSequence += 1;

        const user = {
          id: `user_${idSequence}`,
          email: data.email,
          password: data.password,
          createdAt: new Date("2026-05-31T00:00:00.000Z"),
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
});

beforeEach(() => {
  idSequence = 0;
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

test("registers a user, hashes the password, and returns a JWT", async () => {
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

  const storedUser = users.get("user@example.com");
  assert.notEqual(storedUser.password, "Password123");
  assert.equal(await bcrypt.compare("Password123", storedUser.password), true);
});

test("rejects invalid registration input with field errors", async () => {
  const { response, payload } = await request("/api/auth/register", {
    method: "POST",
    body: {
      email: "not-an-email",
      password: "short",
      passwordConfirmation: "different",
    },
  });

  assert.equal(response.status, 422);
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, "VALIDATION_ERROR");
  assert.ok(payload.error.details.email);
  assert.ok(payload.error.details.password);
  assert.ok(payload.error.details.passwordConfirmation);
});

test("rejects duplicate registration", async () => {
  await request("/api/auth/register", {
    method: "POST",
    body: {
      email: "user@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    },
  });

  const { response, payload } = await request("/api/auth/register", {
    method: "POST",
    body: {
      email: "user@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    },
  });

  assert.equal(response.status, 409);
  assert.equal(payload.error.code, "EMAIL_ALREADY_REGISTERED");
});

test("logs in with valid credentials", async () => {
  await request("/api/auth/register", {
    method: "POST",
    body: {
      email: "user@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    },
  });

  const { response, payload } = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "user@example.com",
      password: "Password123",
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.user.email, "user@example.com");
  assert.ok(payload.data.token);
});

test("rejects invalid login credentials", async () => {
  const { response, payload } = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "missing@example.com",
      password: "Password123",
    },
  });

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "INVALID_CREDENTIALS");
});

test("requires a Bearer token for the current-user endpoint", async () => {
  const { response, payload } = await request("/api/auth/me");

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_TOKEN_REQUIRED");
});

test("returns the authenticated user for a valid token", async () => {
  const registered = await request("/api/auth/register", {
    method: "POST",
    body: {
      email: "user@example.com",
      password: "Password123",
      passwordConfirmation: "Password123",
    },
  });

  const { response, payload } = await request("/api/auth/me", {
    headers: {
      authorization: `Bearer ${registered.payload.data.token}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.user.email, "user@example.com");
});
