const asyncHandler = require("../utils/asyncHandler");

const authService = require("../services/authService");



const signup = asyncHandler(async (req, res) => {

  const data = await authService.signup(req.body);

  res.status(201).json({ success: true, data });

});



const login = asyncHandler(async (req, res) => {

  const data = await authService.login(req.body);

  res.json({ success: true, data });

});



const completeLogin2FA = asyncHandler(async (req, res) => {

  const data = await authService.completeLogin2FA(req.body);

  res.json({ success: true, data });

});



const start2FASetup = asyncHandler(async (req, res) => {

  const data = await authService.start2FASetup(req.user._id);

  res.json({ success: true, data });

});



const verify2FASetup = asyncHandler(async (req, res) => {

  const data = await authService.verify2FASetup(req.user._id, req.body.code);

  res.json({ success: true, data });

});



const disable2FA = asyncHandler(async (req, res) => {

  const data = await authService.disable2FA(req.user._id, req.body);

  res.json({ success: true, data });

});



const acceptTerms = asyncHandler(async (req, res) => {

  const data = await authService.acceptTerms(req.user._id);

  res.json({ success: true, data });

});



module.exports = {

  signup,

  login,

  completeLogin2FA,

  start2FASetup,

  verify2FASetup,

  disable2FA,

  acceptTerms,

};


