const mongoose = require("mongoose");

const moodSurveySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    surveyDate: { type: Date, required: true, default: Date.now },
    moodScore: { type: Number, min: 1, max: 10 },
    anxietyScore: { type: Number, min: 1, max: 10 },
    stressScore: { type: Number, min: 1, max: 10 },
    notes: String,
    extraFields: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MoodSurvey", moodSurveySchema);

