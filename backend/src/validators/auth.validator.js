const { AppError } = require("../utils/AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function normalizeEmail(email) {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
}

function addError(errors, field, message) {
  if (!errors[field]) {
    errors[field] = [];
  }

  errors[field].push(message);
}

function assertValid(errors) {
  if (Object.keys(errors).length > 0) {
    throw new AppError("Validation failed", 422, "VALIDATION_ERROR", errors);
  }
}

function validateEmail(email, errors) {
  if (!email) {
    addError(errors, "email", "Email is required");
    return;
  }

  if (!EMAIL_REGEX.test(email)) {
    addError(errors, "email", "Email must be a valid email address");
  }
}

function validatePassword(password, errors) {
  if (typeof password !== "string" || password.length === 0) {
    addError(errors, "password", "Password is required");
    return;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    addError(
      errors,
      "password",
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    );
  }
}

function validateRegisterInput(body = {}) {
  const errors = {};
  const email = normalizeEmail(body.email);
  const password = body.password;
  const passwordConfirmation = body.passwordConfirmation;

  validateEmail(email, errors);
  validatePassword(password, errors);

  if (
    typeof passwordConfirmation !== "string" ||
    passwordConfirmation.length === 0
  ) {
    addError(
      errors,
      "passwordConfirmation",
      "Password confirmation is required"
    );
  } else if (password !== passwordConfirmation) {
    addError(errors, "passwordConfirmation", "Passwords do not match");
  }

  assertValid(errors);

  return {
    email,
    password,
  };
}

function validateLoginInput(body = {}) {
  const errors = {};
  const email = normalizeEmail(body.email);
  const password = body.password;

  validateEmail(email, errors);

  if (typeof password !== "string" || password.length === 0) {
    addError(errors, "password", "Password is required");
  }

  assertValid(errors);

  return {
    email,
    password,
  };
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  validateLoginInput,
  validateRegisterInput,
};
