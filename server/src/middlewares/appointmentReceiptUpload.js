const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "../../uploads/appointments");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(uploadRoot, String(req.user._id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const allowedMime =
  /^(image\/(jpeg|png|gif|webp)|application\/pdf|text\/plain|application\/msword|application\/vnd\.openxmlformats)/;

module.exports = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only screenshot or PDF receipt files are allowed"));
  },
});
