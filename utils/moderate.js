const axios = require("axios");
const cache = new Map();
const MAX_CACHE = 5000;

/**
 * Moderates text using OpenAI's free Moderation API.
 * This works perfectly on Vercel without needing a separate Python server.
 */
async function moderateText(text) {
  if (!text || text.trim() === "") {
    return { flagged: false, score: 0 };
  }

  const normalized = text.toLowerCase().trim();

  // Return from cache if we've seen this text before
  if (cache.has(normalized)) {
    return cache.get(normalized);
  }

  // Use OpenAI API key from environment variables
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: OPENAI_API_KEY is missing from environment variables!");
    return { flagged: false, score: 0 };
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/moderations",
      { input: text },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        timeout: 5000,
      }
    );

    const result = response.data.results[0];
    
    // Pick the highest score among all toxic categories
    const maxScore = Math.max(...Object.values(result.category_scores));

    const output = {
      flagged: result.flagged, // OpenAI's built-in detection
      score: maxScore,
    };

    // Save to cache
    cache.set(normalized, output);
    if (cache.size > MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    console.log(`Moderation check: flagged=${output.flagged}, score=${output.score.toFixed(4)}`);
    return output;

  } catch (err) {
    console.error("MODERATION API ERROR:", err.response?.data || err.message);
    // Fallback: allow the post if the API is down to avoid breaking the app
    return { flagged: false, score: 0 };
  }
}

module.exports = moderateText;
