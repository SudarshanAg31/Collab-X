const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
module.exports = (err, _req, res, _next) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details;

  if (err instanceof ApiError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON in request body';
  } else if (err.message) {
    message = err.message;
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  const payload = { success: false, error: { code, message } };
  if (details !== undefined) payload.error.details = details;
  res.status(status).json(payload);
};