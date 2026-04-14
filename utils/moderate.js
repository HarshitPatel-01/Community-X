const axios = require("axios");
const cache = new Map();
const MAX_CACHE = 5000;

/**
 * Moderates text using a custom Python service on Render.
 * Falls back to keyword moderation if the service is unreachable.
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
  const badWords = ["shit", "shitt", "fuck", "fuckk", "bitch", "bastard", "dick", "pussy", "asshole", "motherfucker"];
  const wordsInText = normalized.split(/\W+/);
  const foundBadWord = wordsInText.find(w => badWords.includes(w));

  if (foundBadWord) {
    console.log(`[Moderation] Keyword hit: "${foundBadWord}" found.`);
    return { flagged: true, score: 1.0, label: "toxic (keyword)" };
  }

  // Use the custom Toxic_Model URL from environment variables
  const serviceUrl = process.env.MODERATION_SERVICE_URL;

  if (!serviceUrl) {
    console.error("[Moderation] ERROR: MODERATION_SERVICE_URL environment variable is MISSING.");
    console.log("[Moderation] Please set MODERATION_SERVICE_URL in your Vercel/environment settings.");
    return { flagged: false, score: 0 };
  }

  const apiUrl = `${serviceUrl.replace(/\/$/, "")}/moderate`;
  console.log(`[Moderation] Calling service at: ${apiUrl}`);

  try {
    const response = await axios.post(
      apiUrl,
      { text: text },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 8000, // Reduced timeout for better UX, though RoBERTa is slow
      }
    );

    const result = response.data;
    
    const output = {
      flagged: result.flagged || false,
      score: result.score || 0,
      label: result.label || "none"
    };

    // Save to cache
    cache.set(normalized, output);
    if (cache.size > MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    console.log(`[Moderation] Result: flagged=${output.flagged}, score=${output.score.toFixed(4)}, label=${output.label}`);
    return output;

  } catch (err) {
    if (err.code === "ECONNABORTED") {
      console.error("[Moderation] Service Timeout: The Render service took too long to respond.");
    } else if (err.response) {
      console.error(`[Moderation] Service Error (${err.response.status}):`, err.response.data);
    } else {
      console.error("[Moderation] Connection Error:", err.message);
    }
    
    // Safety check: if it's a connection error, it might be a cold start on Render
    console.log("[Moderation] Fallback: Allowing content due to service unavailability.");
    return { flagged: false, score: 0 };
  }
}

module.exports = moderateText;

