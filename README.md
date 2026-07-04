[iSheria]
Built during the Democracy & AI Hackathon — July 4th, 2026 Hosted by Mozilla Foundation & KamiLimu

# iSheria

A mobile-friendly app that simulates a live feed of Kenyan legislative and
regulatory notices, simplifies them into plain English with AI, and offers
an equally simple Kiswahili version on tap.


Team
Name	Role	GitHub
[Ian Kiprotich]	[Role, System Design]	[@https://github.com/kiprotich25/iSheria]
[Diana Achola Njeri]	[Role, Frontend]	[@handle]
Team Name: [] University: [Kenyatta University, University Of Nairobi]

Problem & User
Problem Statement
[Kenyan citizens with limited formal education, particularly those whose highest educational attainment is primary school and primarily use Swahili for communication, face barriers in locating and understanding civic information presented in technical English and inaccessible formats, evidenced by Saferworld’s finding that in counties like Isiolo, there is a limited flow of legislative information, hindering people’s access to relevant documents in accessible formats and languages. This problem is primarily caused by lack of a widely-accessible, real-time system that pools, translates and simplifies civic legislative information into plain Swahili, supported by Gikibi & Kipchumba’s (2025) study on the Children’s Bill 2021 which revealed that 69.48% of respondents in Nyandarua County had never heard of public participation processes. Despite the government publishing civic information on proposed bills and platforms like Mzalendo, providing access to parliamentary records, the documents shared are still in highly technical English and require users to actively seek out the latest information. A technology solution that addresses the need for timely notices and access to simplified legislative documents could improve awareness on public participation opportunities, understanding of legislative happenings and in turn, make civic engagement more meaningful, while ensuring the AI is not biased towards its training data.]

Target User
Dimension	Detail
Primary user	[A youth passionate about Governance with an urge to participate in law-making processes and uses their mobile phone regularly]
Tech comfort	[Comfortable with simple language like English text; no complex legislative language]
Language	[e.g. Swahili, Sheng, Dholuo  basic English]
Current workflow	[Fails to hear when public participation forums are available and finds the information on government websites hard]
The Specific Gap
What's already there: [Mzalendo.com, Government websites publishing forums for public participation]
Why it falls short: [Because existing civic engagement platforms like Mzalendo and government communication systems are primarily designed as passive information repositories that require citizens to actively search for updates themselves.

]
The gap we fill: [e.g. Specified real-time update on available  public participation forums that are available, simplified Swahili/Sheng summaries delivered the platform and on sms for notifications]
Why It Matters
[e.g. When rural citizens can't track county spending, projects stall, funds divert, and the accountability loop between citizen and government breaks. Closing this information gap restores a basic democratic feedback mechanism: informed citizens can ask better questions, demand answers, and vote accordingly.]

Run Instructions
Prerequisites
Python 3.10+
[Add any other dependencies: Node.js, Docker, API keys, etc.]
Quick Start
# 1. Clone the repo
git clone [https://github.com/kiprotich25/iSheria]
cd [iSheria]

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

## Next steps (post-hackathon)

- Swap the mock release timer for a real scraper (Mzalendo, Hansard, RSS
  feeds from major outlets).
- Add SMS/WhatsApp/Telegram delivery for people without a smartphone app.
- Add a keyword/LLM classifier to filter for "major" political events.

# 5. Run the project
python src/main.py
📁 Project Structure
.hackathon-template/
│
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignored files
├── LICENSE                      # Project license
├── README.md                    # Project documentation
├── requirements.txt             # Python dependencies
│
├── data/
│   └── mock_documents.json      # Sample/mock data
│
├── docs/
│   └── problem-statement.md     # Hackathon problem description
│
└── src/
    │
    ├── main.py                  # Main application entry point
    │
    ├── static/                  # Frontend assets
    │   ├── app.js               # JavaScript logic
    │   ├── style.css            # Stylesheet
    │   ├── index.html           # Main HTML page
    │   ├── manifest.json        # Progressive Web App manifest
    │   ├── sw.js                # Service Worker
    │   ├── icon-192.png         # PWA icon
    │   └── icon-512.png         # PWA icon
    │
    └── __pycache__/             # Python compiled cache
        └── main.cpython-312.pyc

Approach & Architecture
[User] → [Web App] → [Backend / API] → [AI system scraper Government websites] → [Response]→ [Web App] → [SMS notifications] → [User]

License
MIT © [Team Name], 2026











