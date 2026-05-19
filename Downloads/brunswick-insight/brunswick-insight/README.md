# Brunswick Insight — AI Advisory Platform

A polished internal-style AI tool with three capabilities:
- **Narrative Analyser** — media narrative & sentiment analysis
- **Stakeholder Briefing Generator** — pre-meeting intelligence briefings  
- **Crisis Communications Assistant** — rapid-response messaging options

Built with Flask + Anthropic Claude (streaming) + vanilla JS.

---

## Deploy to Railway in under 5 minutes

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create brunswick-insight --public --push
```

Or manually create a repo on github.com and push.

### Step 2 — Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your `brunswick-insight` repo
4. Railway auto-detects Python and starts building

### Step 3 — Add your API key

In Railway dashboard → your service → **Variables** tab:

```
ANTHROPIC_API_KEY = sk-ant-...your key here...
```

### Step 4 — Get your URL

Railway → your service → **Settings** → **Networking** → Generate Domain.

Done. Your app is live.

---

## Run locally

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python app.py
```

Then open http://localhost:5000
