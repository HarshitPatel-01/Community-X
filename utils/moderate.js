const axios = require("axios");
const cache = new Map();
const MAX_CACHE = 5000;

/**
 * Moderates text using the RoBERTa toxicity model.
 * @param {string} text - The text to check for toxicity.
 * @returns {Promise<{flagged: boolean, score: number}>}
 */
async function moderateText(text) {
  if (!text || text.trim() === "") {
    return { flagged: false, score: 0 };
  }

  const normalized = text.toLowerCase().trim();

  if (cache.has(normalized)) {
    return cache.get(normalized);
  }

  try {
    // Note: The FastAPI server for RoBERTa should be running on this URL
    // Changed to 5001 to avoid conflict with Express server (on 5000)
    const response = await axios.post("http://127.0.0.1:8000/moderate", {
      text: normalized
    }, {
      timeout: 5000 
    });

    const result = response.data;
    const output = {
      flagged: !!result.flagged,
      score: result.score || 0
    };

    cache.set(normalized, output);
    if (cache.size > MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    return output;

  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.error("CRITICAL: Moderation endpoint /moderate returned 404! Check FastAPI server.");
    } else {
      console.warn("MODERATION ERROR (Model server might be down):", err.message);
    }
    return { flagged: false, score: 0 };
  }
}

module.exports = moderateText;
