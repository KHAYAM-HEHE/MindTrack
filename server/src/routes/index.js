const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const professionalRoutes = require("./professionalRoutes");
const adminRoutes = require("./adminRoutes");
const reportRoutes = require("./reportRoutes");
const chatRoutes = require("./chatRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/professionals", professionalRoutes);
router.use("/admin", adminRoutes);
router.use("/reports", reportRoutes);
router.use("/chat", chatRoutes);

module.exports = router;

