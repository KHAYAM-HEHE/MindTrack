const generateSimpleInsights = ({ moodAverage, completionRate }) => {
  if (moodAverage >= 7 && completionRate >= 70) {
    return "Overall trend is positive with consistent task adherence.";
  }
  if (moodAverage < 5) {
    return "Mood trend appears lower than expected; suggest professional follow-up.";
  }
  return "Progress is mixed. Focus on consistent routines and follow-up logging.";
};

module.exports = { generateSimpleInsights };

