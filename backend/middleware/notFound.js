const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  
  // Log the 404 error
  console.log(`❌ 404 Error: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  next(error);
};

module.exports = { notFound };
