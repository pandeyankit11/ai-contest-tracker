const { AppError } = require("../utils/AppError");

function validateSyncRequest() {
  // Sync endpoint requires authentication (validated by middleware) and valid platform
  // No additional body validation needed for MVP
}

module.exports = {
  validateSyncRequest,
};
