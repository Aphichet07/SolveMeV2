
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from nlp import thai_tokenizer  
from pythainlp import word_tokenize
from pythainlp.corpus import thai_stopwords
import re

df = pd.read_csv("data/real_dataset.csv") 
newdata = df.sample(frac=1, random_state=42).reset_index(drop=True)

def preprocessing(text):
  text = re.sub(r"http\S+|www\.\S+", " ", text)
  text = re.sub(r"[@#]\w+", " ", text)

  emoji_pattern = re.compile(
        "["                    
        "\U0001F600-\U0001F64F" 
        "\U0001F300-\U0001F5FF" 
        "\U0001F680-\U0001F6FF"
        "\U0001F700-\U0001F77F"
        "\U0001F780-\U0001F7FF"
        "\U0001F800-\U0001F8FF"
        "\U0001F900-\U0001F9FF"
        "\U0001FA00-\U0001FA6F"
        "\U0001FA70-\U0001FAFF"
        "\u2600-\u26FF"        
        "\u2700-\u27BF"       
        "]+",
        flags=re.UNICODE,
    )
  
  text = emoji_pattern.sub(" ", text)
  text = re.sub(r"\s+", " ", text)
  text = re.sub(r"\s+", " ", text).strip()

  return text.strip()

X = df["sentence"].tolist()
y = df["priority"].tolist()

thai_vectorizer = TfidfVectorizer(
    tokenizer=thai_tokenizer,
    token_pattern=None,
    ngram_range=(1, 2),
    min_df=1,
    max_df=1.0,
)

X_tfidf = thai_vectorizer.fit_transform(X)

thai_clf = LogisticRegression(
    max_iter=1000,
    class_weight="balanced",
    n_jobs=-1,
)
thai_clf.fit(X_tfidf, y)

joblib.dump(thai_vectorizer, "model/thai_vectorizer.pkl")
joblib.dump(thai_clf, "model/thai_clf.pkl")

print("saved models to model/thai_vectorizer.pkl, model/thai_clf.pkl")
