const ApiError = require("../utils/ApiError");

const requireFields = (fields = []) => (req, _res, next) => {
  const missing = fields.filter((field) => req.body[field] === undefined);
  if (missing.length) {
    throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
  }
  next();
};

module.exports = { requireFields };

