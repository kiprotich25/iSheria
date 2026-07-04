"""
Sauti ya Sheria - backend
Simulates a scraper releasing legislative/regulatory documents over time,
then uses DeepSeek to (1) simplify them into plain English (6th-grade level)
and (2) optionally produce an equally simple Kiswahili version.

Run with:
    uvicorn src.main:app --reload --port 8000
Then open http://localhost:8000 in a mobile browser / device emulator.
"""

import json
import os
import time
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "mock_documents.json"
STATIC_DIR = Path(__file__).resolve().parent / "static"

# Record when the server started so we can simulate the scraper
# "releasing" documents on a timeline (release_offset_seconds after boot).
SERVER_START_TIME = time.time()

app = FastAPI(title="Sauti ya Sheria API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache so we don't re-call the model for the same
# document/language combo twice during a demo.
_summary_cache: dict[str, str] = {}


def load_documents() -> list[dict]:
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


ALL_DOCUMENTS = load_documents()


def call_deepseek(system_prompt: str, user_prompt: str) -> str:
    if not DEEPSEEK_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="DEEPSEEK_API_KEY is not set. Copy .env.example to .env and add your key.",
        )

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 350,
    }

    try:
        response = requests.post(DEEPSEEK_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"DeepSeek API error: {exc}") from exc

    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def simplify_english(doc: dict) -> str:
    system_prompt = (
        "You explain Kenyan government and legislative notices to ordinary citizens. "
        "Rewrite the notice in very simple English, at a reading level suitable for "
        "someone who did not go past primary school (6th grade). Use short sentences "
        "and everyday words. Explain any legal or technical terms in plain language. "
        "Keep it factual and only use information present in the text. "
        "Limit the summary to 3-5 short sentences."
    )
    user_prompt = f"Title: {doc['title']}\n\nNotice:\n{doc['body']}"
    return call_deepseek(system_prompt, user_prompt)


def simplify_kiswahili(doc: dict, english_summary: str) -> str:
    system_prompt = (
        "Wewe ni msaidizi anayeeleza taarifa za kiserikali na kisheria za Kenya kwa "
        "lugha rahisi ya Kiswahili sanifu. Andika muhtasari mfupi, wenye sentensi fupi "
        "na maneno ya kawaida, unaoeleweka kwa mtu ambaye hajasoma zaidi ya darasa la sita. "
        "Tumia tu taarifa zilizomo kwenye muhtasari uliopewa. Toa sentensi 3-5 fupi tu."
    )
    user_prompt = f"Muhtasari kwa Kiingereza:\n{english_summary}\n\nTafsiri kwa Kiswahili rahisi."
    return call_deepseek(system_prompt, user_prompt)


class SummarizeRequest(BaseModel):
    doc_id: str
    lang: str = "en"  # "en" or "sw"


@app.get("/api/documents")
def get_documents():
    """Return only the documents that have 'been scraped' so far,
    based on elapsed time since the server booted."""
    elapsed = time.time() - SERVER_START_TIME
    released = [
        {k: v for k, v in doc.items()}
        for doc in ALL_DOCUMENTS
        if doc["release_offset_seconds"] <= elapsed
    ]
    released.sort(key=lambda d: d["release_offset_seconds"])
    return {"elapsed_seconds": round(elapsed, 1), "documents": released}


@app.post("/api/summarize")
def summarize(req: SummarizeRequest):
    doc = next((d for d in ALL_DOCUMENTS if d["id"] == req.doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    cache_key = f"{req.doc_id}:en"
    if cache_key in _summary_cache:
        english_summary = _summary_cache[cache_key]
    else:
        english_summary = simplify_english(doc)
        _summary_cache[cache_key] = english_summary

    if req.lang == "en":
        return {"lang": "en", "summary": english_summary}

    if req.lang == "sw":
        sw_key = f"{req.doc_id}:sw"
        if sw_key in _summary_cache:
            swahili_summary = _summary_cache[sw_key]
        else:
            swahili_summary = simplify_kiswahili(doc, english_summary)
            _summary_cache[sw_key] = swahili_summary
        return {"lang": "sw", "summary": swahili_summary}

    raise HTTPException(status_code=400, detail="lang must be 'en' or 'sw'")


@app.post("/api/reset-timer")
def reset_timer():
    """Handy for demos: restart the release timeline from zero without restarting the server."""
    global SERVER_START_TIME
    SERVER_START_TIME = time.time()
    return {"status": "reset"}


# Serve the mobile frontend
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
