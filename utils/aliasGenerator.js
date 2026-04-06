const adjectives = ["Shadow", "Neon", "Ghost", "Silver", "Crimson", "Midnight", "Silent", "Hidden", "Dark", "Ethereal"];
const nouns = ["Wolf", "Fox", "Eagle", "Dragon", "Runner", "Hunter", "Wanderer", "Seeker", "Ghost", "Phantom"];

function generateAlias() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    return `${adj}${noun}${num}`;
}

module.exports = generateAlias;
