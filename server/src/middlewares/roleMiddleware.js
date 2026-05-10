const ApiError = require("../utils/ApiError");

const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ApiError(403, "Forbidden: insufficient permissions");
    }
    next();
  };
};

module.exports = { authorize };

