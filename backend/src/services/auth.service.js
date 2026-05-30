const bcrypt = require("bcrypt");

const { env } = require("../config/env");
const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");
const { signAuthToken } = require("../utils/jwt");

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  createdAt: true,
};

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt:
      user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

function buildAuthResponse(user) {
  const formattedUser = formatUser(user);

  return {
    user: formattedUser,
    token: signAuthToken(formattedUser),
  };
}

function isUniqueConstraintError(error) {
  return error && error.code === "P2002";
}

async function registerUser({ email, password }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(
      "Email is already registered",
      409,
      "EMAIL_ALREADY_REGISTERED"
    );
  }

  const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      select: SAFE_USER_SELECT,
    });

    return buildAuthResponse(user);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        "Email is already registered",
        409,
        "EMAIL_ALREADY_REGISTERED"
      );
    }

    throw error;
  }
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...SAFE_USER_SELECT,
      password: true,
    },
  });

  const isPasswordValid =
    user && (await bcrypt.compare(password, user.password));

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  return buildAuthResponse(user);
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });

  return user ? formatUser(user) : null;
}

module.exports = {
  getUserById,
  loginUser,
  registerUser,
};
