const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");

const CONTEST_ACCOUNT_SELECT = {
  id: true,
  userId: true,
  platform: true,
  handle: true,
  createdAt: true,
};

function formatContestAccount(account) {
  return {
    id: account.id,
    userId: account.userId,
    platform: account.platform,
    handle: account.handle,
    createdAt:
      account.createdAt instanceof Date
        ? account.createdAt.toISOString()
        : account.createdAt,
  };
}

function isUniqueConstraintError(error) {
  return error && error.code === "P2002";
}

async function addPlatformAccount(userId, { platform, handle }) {
  try {
    const account = await prisma.contestAccount.create({
      data: {
        userId,
        platform,
        handle,
      },
      select: CONTEST_ACCOUNT_SELECT,
    });

    return formatContestAccount(account);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(
        "Platform account already exists for this user",
        409,
        "PLATFORM_ACCOUNT_ALREADY_EXISTS"
      );
    }

    throw error;
  }
}

async function listPlatformAccounts(userId) {
  const accounts = await prisma.contestAccount.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: CONTEST_ACCOUNT_SELECT,
  });

  return accounts.map(formatContestAccount);
}

async function deletePlatformAccount(userId, accountId) {
  const result = await prisma.contestAccount.deleteMany({
    where: {
      id: accountId,
      userId,
    },
  });

  if (result.count === 0) {
    throw new AppError(
      "Platform account not found",
      404,
      "PLATFORM_ACCOUNT_NOT_FOUND"
    );
  }
}

module.exports = {
  addPlatformAccount,
  deletePlatformAccount,
  listPlatformAccounts,
};
