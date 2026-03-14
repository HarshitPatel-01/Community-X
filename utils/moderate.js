const fetch = require("node-fetch");

const cache = new Map();
const MAX_CACHE = 5000;

async function moderateText(text){

  if(!text || text.trim() === ""){
    return { flagged:false }
  }

  const normalized = text.toLowerCase().trim();

  if(cache.has(normalized)){
    return cache.get(normalized);
  }

  try{
    const response = await fetch("http://127.0.0.1:8000/moderate",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({text: normalized})
    });

    const result = await response.json();

    const output = {
      flagged: result.flagged,
      score: result.score
    };

    cache.set(normalized, output);

    if(cache.size > MAX_CACHE){
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return output;

  }catch(err){

    console.log("MODERATION ERROR:",err.message);

    return { flagged:false }
  }

}

module.exports = moderateText;
