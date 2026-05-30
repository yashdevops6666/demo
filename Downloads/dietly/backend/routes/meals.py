from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Literal
from datetime import date

from services.ai_service import generate_meal_plan
from database import get_db
from models import UsageLog

router = APIRouter()

class MealPlanRequest(BaseModel):
    monthly_budget: float
    preference: Literal["veg", "nonveg", "mixed"]
    people: int = 1
    restrictions: list[str] = []

class MealPlanResponse(BaseModel):
    plan: dict
    insights: list[str]
    estimated_weekly_cost: float
    total_monthly_cost: float


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


@router.post("/generate", response_model=MealPlanResponse)
async def generate(
    request: Request,
    body: MealPlanRequest,
    db: AsyncSession = Depends(get_db),
):
    if body.monthly_budget < 30:
        raise HTTPException(400, "Minimum budget is £30/month")

    ip = get_client_ip(request)
    today = date.today()

    # Check if this IP already generated a plan today
    result = await db.execute(
        select(func.count()).where(
            UsageLog.ip_address == ip,
            UsageLog.used_date == today,
        )
    )
    count = result.scalar()
    if count >= 1:
        raise HTTPException(
            429,
            "You've already generated a meal plan today. Come back tomorrow for a fresh plan! 🌅"
        )

    try:
        meal_plan = await generate_meal_plan(
            budget=body.monthly_budget,
            preference=body.preference,
            people=body.people,
            restrictions=body.restrictions,
        )
    except Exception as e:
        raise HTTPException(500, str(e))

    # Record usage only after a successful generation
    db.add(UsageLog(ip_address=ip, used_date=today))
    await db.commit()

    return meal_plan


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
        ],
    }
