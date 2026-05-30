const {
  validatePlatformAccountId,
  validatePlatformAccountInput,
} = require("../validators/platform.validator");
const {
  addPlatformAccount,
  deletePlatformAccount,
  listPlatformAccounts,
} = require("../services/platform.service");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const input = validatePlatformAccountInput(req.body);
  const account = await addPlatformAccount(req.user.id, input);

  res.status(201).json({
    success: true,
    data: {
      account,
    },
  });
});

const list = asyncHandler(async (req, res) => {
  const accounts = await listPlatformAccounts(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      accounts,
    },
  });
});

const remove = asyncHandler(async (req, res) => {
  const accountId = validatePlatformAccountId(req.params.id);

  await deletePlatformAccount(req.user.id, accountId);

  res.status(204).send();
});

module.exports = {
  create,
  list,
  remove,
};
