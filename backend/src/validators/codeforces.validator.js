const { AppError } = require("../utils/AppError");

function validateCodeforcesHandle(handle) {
  if (typeof handle !== "string" || handle.trim().length === 0) {
    throw new AppError(
      "Codeforces handle is missing",
      422,
      "CODEFORCES_HANDLE_MISSING",
      {
        handle: ["Codeforces handle is required before fetching profile data"],
      }
    );
  }

  return handle.trim();
}

module.exports = {
  validateCodeforcesHandle,
};
