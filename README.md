# Bunge Feed

A mobile-friendly app that simulates a live feed of Kenyan legislative and
regulatory notices, simplifies them into plain English with AI, and offers
an equally simple Kiswahili version on tap.

## How it works

- `data/mock_documents.json` holds hardcoded sample notices, each tagged
  with a `release_offset_seconds` — how many seconds after the server
  starts it should "appear," simulating a scraper finding new content.
- `src/main.py` (FastAPI) exposes:
  - `GET /api/documents` — returns only the notices that have "been
    scraped" so far.
  - `POST /api/summarize` — given a `doc_id` and `lang` (`en` or `sw`),
    calls DeepSeek to produce a 6th-grade-level summary, cached in memory.
  - `POST /api/reset-timer` — restarts the release timeline (handy for
    re-running a demo without restarting the server).
- `src/static/` is a small vanilla JS app: a notification-style feed screen
  and a detail screen with an English/Kiswahili toggle and a deadline chip.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env and paste your DeepSeek API key
```

## Run

```bash
uvicorn src.main:app --reload --port 8000
```

Open `http://localhost:8000` — on your laptop for a quick check, or on
your phone (same Wi-Fi, use your machine's local IP instead of
`localhost`) to demo it as a mobile app. Allow notifications when prompted
to see the "new notice" push alerts.

## Installing on Android as a PWA

This app is a full PWA (manifest + service worker included), so Android
Chrome can install it as a real app icon with no browser bar — no
Android Studio build required.

**Notification permission and the service worker both require a "secure
context"** (`https://` or `localhost`). Opening the app over your local
network as `http://<laptop-ip>:8000` won't satisfy that, so use one of
these instead:

**Option A — `adb reverse` (you already have Android Studio, so this is
the cleanest option):**
```bash
adb reverse tcp:8000 tcp:8000
```
Plug your phone in via USB with USB debugging enabled, run the command
above, then open `http://localhost:8000` **in Chrome on the phone**. The
phone treats `localhost` as secure, and traffic is tunneled straight to
your laptop's server — notifications and install prompt both work.

**Option B — `ngrok` (no cable needed):**
```bash
ngrok http 8000
```
Open the `https://...ngrok-free.app` URL it gives you, on your phone,
over any network.

**Then install it:**
1. Open the app URL in Chrome on the phone.
2. Tap the ⋮ menu → **"Install app"** (or you'll see an automatic install
   banner). Android will use the icon and name from `manifest.json`.
3. It launches full-screen with no address bar, and shows up on the home
   screen and app drawer like any other installed app.

## Demo tips

- Notices are released at 5s, 25s, and 45s after the server starts, so a
  full demo cycle takes well under a minute.
- Call `POST /api/reset-timer` (e.g. with `curl -X POST
  http://localhost:8000/api/reset-timer`) to replay the release sequence
  without restarting the server.
- Adjust `release_offset_seconds` in `data/mock_documents.json` to slow
  down or speed up the simulated release for your pitch.

## Next steps (post-hackathon)

- Swap the mock release timer for a real scraper (Mzalendo, Hansard, RSS
  feeds from major outlets).
- Add SMS/WhatsApp/Telegram delivery for people without a smartphone app.
- Add a keyword/LLM classifier to filter for "major" political events.
