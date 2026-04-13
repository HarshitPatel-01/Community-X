import os
import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

# Limit threads to save memory in constrained environments
torch.set_num_threads(1)

app = FastAPI()

# Switch to a smaller DistilBERT model (approx 260MB) to fit into 512MB RAM
# The previous model (RoBERTa) was ~500MB, which causes OOM on Render Free tier.
MODEL_NAME = "martin-ha/toxic-comment-model"

print(f"Loading model: {MODEL_NAME}...")
classifier = pipeline(
    "text-classification",
    model=MODEL_NAME,
    device=-1, # Force CPU
    model_kwargs={"low_cpu_mem_usage": True}
)
print("Model loaded successfully.")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

class TextInput(BaseModel):
    text: str

@app.post("/moderate")
def moderate(data: TextInput):
    if not data.text or not data.text.strip():
        return {"flagged": False, "score": 0, "label": "none"}

    # Use torch.no_grad() to ensure no extra memory is used for gradients
    with torch.no_grad():
        # Get scores for all labels to be more thorough
        results = classifier(data.text, top_k=None)
    
    toxic_labels = ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
    
    flagged = False
    max_toxic_score = 0
    top_label = "none"

    # Find the highest toxic score across all categories
    for res in results:
        label = res["label"].lower()
        score = res["score"]
        
        if label in toxic_labels:
            if score > max_toxic_score:
                max_toxic_score = score
                top_label = label
            
            # Lowered threshold to 0.4 for better detection of borderline toxicity
            if score > 0.4:
                flagged = True
        elif label == "non-toxic" and not top_label or top_label == "none":
            # Keep track of top label even if not toxic
            if score > max_toxic_score:
                top_label = "non-toxic"

    return {
        "label": top_label,
        "score": max_toxic_score,
        "flagged": bool(flagged)
    }

