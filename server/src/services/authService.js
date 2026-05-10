const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { generateSecret, generateURI, verifySync } = require("otplib");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const ApiError = require("../utils/ApiError");
const { ROLES } = require("../utils/constants");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const signTemp2FAToken = (userId) =>
  jwt.sign({ id: userId, purpose: "2fa_pending" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });

const verifyTemp2FAToken = (tempToken) => {
  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.purpose !== "2fa_pending" || !decoded.id) {
      throw new ApiError(401, "Invalid verification session");
    }
    return decoded.id;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Verification session expired — sign in again");
  }
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  phone: user.phone,
  is2FAEnabled: user.is2FAEnabled,
  termsAccepted: user.termsAccepted,
});

const signup = async ({ name, email, password, role, phone }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email already registered");
  const allowedPublicRoles = [ROLES.CLIENT, ROLES.PROFESSIONAL];
  const requestedRole = role || ROLES.CLIENT;
  if (!allowedPublicRoles.includes(requestedRole)) {
    throw new ApiError(403, "This role cannot be created through public signup");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: requestedRole,
    phone,
  });

  await UserProfile.create({ userId: user._id });

  const token = signToken(user._id);
  return { token, user: sanitizeUser(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");
  if (user.status === "BANNED") throw new ApiError(403, "Account is banned");
  if (user.status === "SUSPENDED") throw new ApiError(403, "Account is suspended");

  if (user.is2FAEnabled) {
    const withSecret = await User.findById(user._id).select("+totpSecret");
    if (withSecret?.totpSecret) {
      const tempToken = signTemp2FAToken(user._id);
      return {
        requires2FA: true,
        tempToken,
        user: sanitizeUser(user),
      };
    }
  }

  const token = signToken(user._id);
  return { token, user: sanitizeUser(user) };
};

const completeLogin2FA = async ({ tempToken, code }) => {
  const userId = verifyTemp2FAToken(tempToken);
  const tokenDigits = String(code || "").replace(/\s/g, "");
  if (tokenDigits.length < 6) throw new ApiError(400, "Enter the 6-digit code");

  const user = await User.findById(userId).select("+totpSecret");
  if (!user?.totpSecret) throw new ApiError(400, "Two-factor authentication is not fully configured");

  const result = verifySync({ secret: user.totpSecret, token: tokenDigits });
  if (!result.valid) throw new ApiError(401, "Invalid authentication code");

  const fresh = await User.findById(userId);
  const jwtToken = signToken(user._id);
  return { token: jwtToken, user: sanitizeUser(fresh) };
};

const start2FASetup = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.is2FAEnabled) throw new ApiError(400, "Disable two-factor authentication before setting up again");

  const secret = generateSecret();
  await User.findByIdAndUpdate(userId, { totpPendingSecret: secret });

  const otpauthUrl = generateURI({
    issuer: "MindWell",
    label: user.email,
    secret,
  });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret,
    otpauthUrl,
    qrDataUrl,
  };
};

const verify2FASetup = async (userId, code) => {
  const tokenDigits = String(code || "").replace(/\s/g, "");
  if (tokenDigits.length < 6) throw new ApiError(400, "Enter the 6-digit code");

  const user = await User.findById(userId).select("+totpPendingSecret");
  if (!user?.totpPendingSecret) throw new ApiError(400, "Start setup first — scan the QR code or enter the secret");

  const result = verifySync({ secret: user.totpPendingSecret, token: tokenDigits });
  if (!result.valid) throw new ApiError(401, "Invalid code — try again");

  await User.findByIdAndUpdate(userId, {
    totpSecret: user.totpPendingSecret,
    totpPendingSecret: null,
    is2FAEnabled: true,
  });

  const updated = await User.findById(userId);
  return sanitizeUser(updated);
};

const disable2FA = async (userId, { password, code }) => {
  const tokenDigits = String(code || "").replace(/\s/g, "");
  if (!password) throw new ApiError(400, "Password is required");
  if (tokenDigits.length < 6) throw new ApiError(400, "Enter the 6-digit code");

  const user = await User.findById(userId).select("+password +totpSecret");
  if (!user?.totpSecret || !user.is2FAEnabled) throw new ApiError(400, "Two-factor authentication is not enabled");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, "Invalid password");

  const result = verifySync({ secret: user.totpSecret, token: tokenDigits });
  if (!result.valid) throw new ApiError(401, "Invalid authentication code");

  await User.findByIdAndUpdate(userId, {
    totpSecret: null,
    totpPendingSecret: null,
    is2FAEnabled: false,
  });

  const updated = await User.findById(userId);
  return sanitizeUser(updated);
};

const acceptTerms = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { termsAccepted: true, termsAcceptedAt: new Date() },
    { new: true }
  );
  return sanitizeUser(user);
};

module.exports = {
  signup,
  login,
  completeLogin2FA,
  start2FASetup,
  verify2FASetup,
  disable2FA,
  acceptTerms,
};
