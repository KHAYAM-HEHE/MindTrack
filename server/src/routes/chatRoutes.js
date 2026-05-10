const express = require("express");
const chatController = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");
const chatUpload = require("../middlewares/chatUpload");

const router = express.Router();
router.use(protect);

router.get("/sessions", chatController.listMySessions);
router.post("/sessions", chatController.getOrCreateSession);
router.post("/sessions/:id/upload", chatUpload.single("file"), chatController.uploadSessionAttachment);
router.get("/sessions/:id/messages", chatController.listMessages);
router.post("/sessions/:id/messages", chatController.sendMessage);

module.exports = router;
