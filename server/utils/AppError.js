export class AppError extends Error {
  constructor(message, statusCode, isOperational = true, details = null) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace and exclude constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}
