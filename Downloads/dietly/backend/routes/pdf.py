from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.pdf_service import build_pdf
import io

router = APIRouter()

class PDFRequest(BaseModel):
    plan: dict
    people: int = 1
    preference: str = "mixed"
    monthly_budget: float = 80.0
    restrictions: list[str] = []

@router.post("/download")
async def download_pdf(request: PDFRequest):
    try:
        pdf_bytes = build_pdf(
            plan=request.plan,
            people=request.people,
            preference=request.preference,
            budget=request.monthly_budget,
            restrictions=request.restrictions,
        )
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=dietly_monthly_plan.pdf"}
        )
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {e}")
