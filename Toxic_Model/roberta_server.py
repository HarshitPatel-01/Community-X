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
        result = classifier(data.text)[0]
    
    label = result["label"].lower()
    score = result["score"]

    # martin-ha/toxic-comment-model returns 'toxic' or 'non-toxic'
    is_toxic_label = label in ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
    
    # Stricter threshold for better moderation
    flagged = is_toxic_label and score > 0.6 

    return {
        "label": label,
        "score": score,
        "flagged": bool(flagged)
    }

