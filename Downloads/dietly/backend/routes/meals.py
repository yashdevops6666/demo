from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import generate_meal_plan
from typing import Literal

router = APIRouter()

class MealPlanRequest(BaseModel):
    monthly_budget: float          # GBP
    preference: Literal["veg", "nonveg", "mixed"]
    people: int = 1
    restrictions: list[str] = []  # e.g. ["no non-veg on Saturday", "no meat on Tue"]

class MealPlanResponse(BaseModel):
    plan: dict
    insights: list[str]
    estimated_weekly_cost: float
    total_monthly_cost: float

@router.post("/generate", response_model=MealPlanResponse)
async def generate(request: MealPlanRequest):
    if request.monthly_budget < 30:
        raise HTTPException(400, "Minimum budget is £30/month")
    try:
        result = await generate_meal_plan(
            budget=request.monthly_budget,
            preference=request.preference,
            people=request.people,
            restrictions=request.restrictions,
        )
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/preferences")
def get_preferences():
    return {
        "options": ["veg", "nonveg", "mixed"],
        "restriction_presets": [
            "No non-veg on Saturday",
            "No eggs on Tuesday and Saturday",
            "No meat on Tuesday and Saturday",
            "Non-veg mandatory on Sunday",
            "Dairy-free",
            "Gluten-free",
        ]
    }
