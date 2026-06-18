// /middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === "development";

  const response = {
    success: false,
    message: err.isOperational
      ? err.message
      : isDev
      ? err.message
      : "Oops! Something went wrong on our end. Please try again shortly.",
  };

  if (err.details) {
    response.details = err.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
  }

  if (isDev && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
