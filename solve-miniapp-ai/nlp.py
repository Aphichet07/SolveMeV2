from typing import List
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_stopwords

THAI_STOPWORDS = set(thai_stopwords())

def thai_tokenizer(text: str) -> List[str]:
    tokens = word_tokenize(text, engine="newmm")
    tokens = [t for t in tokens if t.strip() != ""]
    tokens_wo_stop = [t for t in tokens if t not in THAI_STOPWORDS]
    return tokens_wo_stop or tokens
