const axios = require("axios");
const cache = new Map();
const MAX_CACHE = 5000;

/**
 * Moderates text using the RoBERTa toxicity model.
 * Production: Uses Hugging Face Inference API (same unbiased-toxic-roberta model)
 * Development: Uses local FastAPI server if running
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

  // Production: Use Hugging Face Inference API (same RoBERTa model, free)
  if (process.env.HF_API_TOKEN) {
    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/unitary/unbiased-toxic-roberta",
        { inputs: normalized },
        {
          headers: {
            "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          timeout: 15000  // HF may need time on cold start
        }
      );

      // HF returns array of arrays: [[{label, score}, ...]]
      const predictions = response.data;
      let toxicScore = 0;
      let flagged = false;

      if (Array.isArray(predictions) && Array.isArray(predictions[0])) {
        // Find the "toxic" label score
        const toxicLabel = predictions[0].find(p => p.label === "toxic");
        if (toxicLabel) {
          toxicScore = toxicLabel.score;
          flagged = toxicScore > 0.6;  // Same threshold as local server
        }
      }

      const output = { flagged, score: toxicScore };

      cache.set(normalized, output);
      if (cache.size > MAX_CACHE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      return output;

    } catch (err) {
      console.warn("HuggingFace Moderation error:", err.message);
      // Fall through to local server
    }
  }

  // Development fallback: local RoBERTa FastAPI server
  try {
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
