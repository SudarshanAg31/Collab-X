class ApiError extends Error {
  constructor(statusCode, code, message , details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  static badRequest(code, message , details) { return new ApiError(400, code, message , details); }
  static unauthorized(code = 'UNAUTHORIZED', message = 'Authentication required') { return new ApiError(401, code, message); }
  static forbidden(code = 'FORBIDDEN', message = 'Access denied') { return new ApiError(403, code, message); }
  static notFound(code = 'NOT_FOUND', message = 'Resource not found') { return new ApiError(404, code, message); }
  static conflict(code, message) { return new ApiError(409, code, message); }
}

module.exports = ApiError;