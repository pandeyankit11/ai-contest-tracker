const { AppError } = require("../utils/AppError");

function validateSyncRequest() {
  // Sync endpoint requires authentication (validated by middleware) and valid platform
  // No additional body validation needed for MVP
}

function validateUpcomingContestsQuery(query) {
  const validationErrors = [];

  let page = 1;
  let limit = 20;
  let days = 30;
  let platform = null;

  if (query.page !== undefined) {
    const parsedPage = parseInt(query.page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      validationErrors.push({
        field: "page",
        message: "page must be a positive integer",
      });
    } else {
      page = parsedPage;
    }
  }

  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      validationErrors.push({
        field: "limit",
        message: "limit must be between 1 and 100",
      });
    } else {
      limit = parsedLimit;
    }
  }

  if (query.days !== undefined) {
    const parsedDays = parseInt(query.days, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      validationErrors.push({
        field: "days",
        message: "days must be a positive integer",
      });
    } else {
      days = parsedDays;
    }
  }

  if (query.platform !== undefined && query.platform !== null && query.platform !== "") {
    const validPlatforms = ["CODEFORCES", "LEETCODE"];
    if (!validPlatforms.includes(query.platform)) {
      validationErrors.push({
        field: "platform",
        message: "platform must be CODEFORCES or LEETCODE",
      });
    } else {
      platform = query.platform;
    }
  }

  if (validationErrors.length > 0) {
    throw new AppError(
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      validationErrors
    );
  }

  return {
    page,
    limit,
    days,
    platform,
  };
}

module.exports = {
  validateSyncRequest,
  validateUpcomingContestsQuery,
};
