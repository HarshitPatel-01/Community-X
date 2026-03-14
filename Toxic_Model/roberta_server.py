from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# load roberta toxicity model
classifier = pipeline(
    "text-classification",
    model="unitary/unbiased-toxic-roberta"
)

class TextInput(BaseModel):
    text: str

@app.post("/moderate")
def moderate(data: TextInput):

    result = classifier(data.text)[0]

    flagged = result["score"] > 0.7

    return {
        "label": result["label"],
        "score": result["score"],
        "flagged": flagged
    }

