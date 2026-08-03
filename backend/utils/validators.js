/**
 * Request Query Validation Utilities
 */

/**
 * Validates pagination parameters (page, limit).
 * Returns { valid: true, page, limit } or { valid: false, error }
 */
function validatePagination(query) {
  let page = 1;
  let limit = 10;

  if (query.page !== undefined) {
    const parsedPage = parseInt(query.page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return {
        valid: false,
        error: 'Invalid "page" parameter. Must be a positive integer >= 1.',
      };
    }
    page = parsedPage;
  }

  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return {
        valid: false,
        error: 'Invalid "limit" parameter. Must be an integer between 1 and 100.',
      };
    }
    limit = parsedLimit;
  }

  return { valid: true, page, limit };
}

/**
 * Validates optional month query filter.
 */
function validateMonth(month) {
  if (!month) return { valid: true, month: null };
  const validMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const normalized = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  if (!validMonths.includes(normalized)) {
    return {
      valid: false,
      error: `Invalid "month" parameter: "${month}". Must be a valid month name.`,
    };
  }
  return { valid: true, month: normalized };
}

/**
 * Validates optional boolean query parameter (e.g. featured).
 */
function validateBooleanParam(param, paramName = 'featured') {
  if (param === undefined || param === null || param === '') {
    return { valid: true, value: undefined };
  }
  if (param === 'true' || param === true || param === '1' || param === 1) {
    return { valid: true, value: true };
  }
  if (param === 'false' || param === false || param === '0' || param === 0) {
    return { valid: true, value: false };
  }
  return {
    valid: false,
    error: `Invalid "${paramName}" parameter. Must be true or false.`,
  };
}

module.exports = {
  validatePagination,
  validateMonth,
  validateBooleanParam,
};
