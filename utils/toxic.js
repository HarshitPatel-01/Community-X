const axios = require("axios");

async function checkToxicity(text) {
  try {
    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
      {
        comment: { text },
        languages: ["en"],
        requestedAttributes: { TOXICITY: {} }
      }
    );

    return response.data.attributeScores.TOXICITY.summaryScore.value;

  } catch (err) {
    console.log("TOXICITY CHECK ERROR:", err.message);
    return 0; // fail-safe: allow post if API fails
  }
}

module.exports = checkToxicity;