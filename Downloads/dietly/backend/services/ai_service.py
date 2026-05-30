import anthropic
import json
import os

client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = """You are Dietly — an expert Indian nutritionist and meal planner for UK residents.
You generate detailed, budget-conscious 30-day Indian meal plans.
Always respond with valid JSON only. No markdown, no preamble.

Rules:
- All ingredients available in UK supermarkets or Asian grocery stores
- Prices in GBP, realistic UK market prices — scale costs by exact number of people
- Include breakfast, lunch, snack, dinner for every day
- Respect ALL dietary restrictions STRICTLY — day-specific rules must NEVER be violated
- If a restriction says "no non-veg on Saturday" or "no meat on Saturday", every Saturday across all 4 weeks MUST have only vegetarian meals (type="veg")
- If a restriction says "no eggs/meat on Tuesday and Saturday", apply it to EVERY Tuesday and EVERY Saturday
- estimated_cost for each day must reflect the actual number of people (multiply per-person cost by people count)
- Provide AI health insights based on the plan
"""

async def generate_meal_plan(budget: float, preference: str, people: int, restrictions: list[str]) -> dict:
    weekly_budget = round(budget / 4, 2)
    per_day = round(budget / 30, 2)

    restriction_text = "\n".join(f"- {r}" for r in restrictions) if restrictions else "None"

    prompt = f"""Generate a complete 30-day Indian meal plan for {people} {("person" if people == 1 else "people")} with these parameters:

Monthly budget: £{budget} total for {people} {("person" if people == 1 else "people")} (£{weekly_budget}/week, £{per_day}/day for all {people} {("person" if people == 1 else "people")})
Dietary preference: {preference}

Special restrictions (MUST be enforced on every matching day across all 4 weeks, no exceptions):
{restriction_text}

IMPORTANT: Scale all estimated_cost values for {people} {("person" if people == 1 else "people")}. Do not use per-person costs.

Respond with this exact JSON structure:
{{
  "plan": {{
    "week1": [
      {{
        "day": "Monday",
        "type": "veg|nonveg|sunday_special",
        "breakfast": "meal description",
        "lunch": "meal description",
        "snack": "meal description",
        "dinner": "meal description",
        "estimated_cost": 4.50
      }}
    ],
    "week2": [...],
    "week3": [...],
    "week4": [...]
  }},
  "insights": [
    "AI insight about nutrition balance",
    "AI insight about cost optimisation",
    "AI insight about health benefits",
    "AI insight about meal prep tips",
    "AI insight about ingredient shopping"
  ],
  "estimated_weekly_cost": {weekly_budget},
  "total_monthly_cost": {budget}
}}"""

    message = await client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=8000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    # Strip any accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
