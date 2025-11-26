from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from typing import Dict, Optional

VEC_PATH = "model/thai_vectorizer.pkl"
CLF_PATH = "model/thai_clf.pkl"

PRIORITY_MAP = {
    0: "HIGH",
    1: "MEDIUM",
    2: "LOW"
}


thai_vectorizer = joblib.load(VEC_PATH)
thai_clf = joblib.load(CLF_PATH)

def predict_priority(text: str) -> str:
    X = thai_vectorizer.transform([text])
    y_pred = thai_clf.predict(X)[0]

    return PRIORITY_MAP[int(y_pred)]

def predict_priority_proba(text: str) -> Optional[Dict[str, float]]:
    if not hasattr(thai_clf, "predict_proba"):
        return None

    X = thai_vectorizer.transform([text])
    proba = thai_clf.predict_proba(X)[0]
    classes = thai_clf.classes_

    scores = {
        PRIORITY_MAP[int(cls)]: float(p)
        for cls, p in zip(classes, proba)
    }


    return scores


def identity_preprocessor(x):
    return x

def thai_tokenizer(text: str):
 
    from pythainlp.tokenize import word_tokenize
    from pythainlp.corpus import thai_stopwords

    THAI_STOPWORDS = set(thai_stopwords())
    tokens = word_tokenize(text, engine="newmm")
    tokens = [t for t in tokens if t.strip() != ""]
    tokens_wo_stop = [t for t in tokens if t not in THAI_STOPWORDS]
    return tokens_wo_stop or tokens


app = FastAPI(title="SolveMe Priority Service")

class PriorityRequest(BaseModel):
    text: str   


class PriorityResponse(BaseModel):
    priority: str
    scores: Optional[Dict[str, float]] = None



@app.post("/api/priority", response_model=PriorityResponse)
def classify_priority(req: PriorityRequest):
    label = predict_priority(req.text)
    scores = predict_priority_proba(req.text)

    return PriorityResponse(
        priority=label,
        scores=scores,
    )