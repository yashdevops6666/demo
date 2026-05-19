import os
import json
from flask import Flask, render_template, request, jsonify, Response, stream_with_context
import anthropic

app = Flask(__name__)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_NARRATIVE = """You are an expert strategic communications analyst at a top-tier global advisory firm. 
You specialise in media narrative analysis for corporations navigating high-stakes situations.
Your analysis is sharp, structured, and immediately actionable. You write for senior partners, not interns.
Use clear headers with ## markdown. Be concise and direct. No filler. No waffle."""

SYSTEM_BRIEFING = """You are a senior advisor at a global strategic communications firm.
You prepare stakeholder briefings for C-suite executives and board members before critical engagements.
Your briefings are precise, intelligence-led, and structured for rapid consumption under pressure.
Use clear headers with ## markdown. Write for people who have 5 minutes, not 50."""

SYSTEM_CRISIS = """You are a crisis communications strategist at a global advisory firm with 30 years experience.
You have advised on some of the most high-profile corporate crises in the world.
Your messaging is calm, credible, and strategically sound. You understand that in a crisis, every word counts.
Use clear headers with ## markdown. Provide multiple messaging options with clear rationale for each."""

def make_prompt_narrative(company, topic):
    return f"""Analyse the current media narrative around {company} regarding: {topic}

Provide:
## Executive Summary
2-3 sentence snapshot of where the narrative stands right now.

## Dominant Narrative Themes
The 3-4 main story lines driving coverage. What are journalists and commentators focusing on?

## Sentiment Assessment
Overall tone (positive / negative / mixed / neutral) and why. What is driving sentiment?

## Key Voices & Stakeholders
Who is shaping the narrative? Investors, regulators, NGOs, media outlets, analysts?

## Narrative Risks
What could make this worse? Emerging angles that could escalate.

## Strategic Recommendations
3 concrete actions the communications team should take in the next 72 hours."""

def make_prompt_briefing(company, stakeholder, situation):
    return f"""Prepare a stakeholder briefing for a meeting with {stakeholder} regarding {company}.

Context: {situation}

Structure the briefing as:

## Stakeholder Profile
Who are they, what do they care about, what is their likely posture going into this meeting?

## Key Objectives
What does {company} need to achieve from this engagement?

## Their Likely Concerns
The 3-4 questions or objections they are most likely to raise.

## Recommended Talking Points
Sharp, direct points for each concern. Not scripts — thinking frameworks.

## What to Avoid
Topics, framings or language that could derail the conversation.

## Proposed Ask
The specific outcome or commitment to seek from this meeting."""

def make_prompt_crisis(company, situation, audience):
    return f"""Draft crisis communications for the following situation:

Company: {company}
Situation: {situation}
Primary audience: {audience}

Provide:

## Situation Assessment
How serious is this? What is the window for response?

## Core Messaging Principle
The one thing all communications must convey, regardless of channel.

## Option A — Transparent & Direct
Full acknowledgement approach. Who this suits and the full draft statement.

## Option B — Measured & Controlled  
Acknowledge without over-disclosing. Who this suits and the full draft statement.

## Option C — Hold & Monitor
Minimal response while gathering facts. When this is appropriate and what to say.

## Channel Guidance
How messaging should differ across: press statement / social media / internal staff / investors

## What Not to Say
Language, framings and stances to avoid at all costs."""

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/analyse", methods=["POST"])
def analyse():
    data = request.json
    tool = data.get("tool")
    
    if tool == "narrative":
        system = SYSTEM_NARRATIVE
        prompt = make_prompt_narrative(data.get("company", ""), data.get("topic", ""))
    elif tool == "briefing":
        system = SYSTEM_BRIEFING
        prompt = make_prompt_briefing(data.get("company", ""), data.get("stakeholder", ""), data.get("situation", ""))
    elif tool == "crisis":
        system = SYSTEM_CRISIS
        prompt = make_prompt_crisis(data.get("company", ""), data.get("situation", ""), data.get("audience", ""))
    else:
        return jsonify({"error": "Unknown tool"}), 400

    def generate():
        with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
