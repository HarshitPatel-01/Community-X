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

  // Quick keyword check for common bypasses (e.g., "shitt", "fuckk")
  // This acts as a safety net if the AI model is unreachable or fails
  const badWords = ["shit", "shitt", "fuck", "fuckk", "bitch", "bastard", "dick"];
  const wordsInText = normalized.split(/\W+/);
  const foundBadWord = wordsInText.find(w => badWords.includes(w));

  if (foundBadWord) {
    console.log(`Keyword moderation: flagged word "${foundBadWord}" found.`);
    return { flagged: true, score: 1.0, label: "toxic (keyword)" };
  }

  // Use the custom Toxic_Model URL from environment variables
  const serviceUrl = process.env.MODERATION_SERVICE_URL;

  if (!serviceUrl) {
    console.warn("WARNING: MODERATION_SERVICE_URL is missing. Falling back to no moderation.");
    return { flagged: false, score: 0 };
  }

  try {
    const response = await axios.post(
      `${serviceUrl.replace(/\/$/, "")}/moderate`,
      { text: text },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // Roberta might take a bit longer than OpenAI
      }
    );

    const result = response.data;
    
    const output = {
      flagged: result.flagged,
      score: result.score,
      label: result.label
    };

    // Save to cache
    cache.set(normalized, output);
    if (cache.size > MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    console.log(`Moderation check: flagged=${output.flagged}, score=${output.score.toFixed(4)}, label=${output.label}`);
    return output;

  } catch (err) {
    console.error("MODERATION SERVICE ERROR:", err.response?.data || err.message);
    // Fallback: allow the post if the service is down to avoid breaking the app
    return { flagged: false, score: 0 };
  }
}

module.exports = moderateText;
