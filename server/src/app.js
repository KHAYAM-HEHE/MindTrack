const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "MindTrack API is healthy" });
});

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api", routes);
app.use(errorHandler);

module.exports = app;

