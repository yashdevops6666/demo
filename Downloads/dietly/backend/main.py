from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import meals, pdf, auth

app = FastAPI(title="Dietly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(meals.router, prefix="/api/meals", tags=["meals"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["pdf"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "dietly-backend"}
