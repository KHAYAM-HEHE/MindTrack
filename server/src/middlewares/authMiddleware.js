const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    throw new ApiError(401, "Not authorized, token missing");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose === "2fa_pending") {
    throw new ApiError(401, "Complete two-factor authentication before using this token");
  }
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError(401, "Not authorized, user not found");
  }
  if (user.status === "BANNED") throw new ApiError(403, "Account is banned");
  if (user.status === "SUSPENDED") throw new ApiError(403, "Account is suspended");

  req.user = user;
  next();
});

module.exports = { protect };

