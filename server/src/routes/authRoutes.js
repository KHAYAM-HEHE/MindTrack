const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { requireFields } = require("../middlewares/validateMiddleware");

const router = express.Router();

router.post(
  "/signup",
  requireFields(["name", "email", "password"]),
  authController.signup
);
router.post("/login", requireFields(["email", "password"]), authController.login);
router.post(
  "/login/2fa",
  requireFields(["tempToken", "code"]),
  authController.completeLogin2FA
);

router.post("/2fa/setup/start", protect, authController.start2FASetup);
router.post("/2fa/setup/verify", protect, requireFields(["code"]), authController.verify2FASetup);
router.post(
  "/2fa/disable",
  protect,
  requireFields(["password", "code"]),
  authController.disable2FA
);

router.post("/terms/accept", protect, authController.acceptTerms);

module.exports = router;
