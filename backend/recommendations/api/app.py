from fastapi import FastAPI
from routes import router

app = FastAPI(
    title="NorthStar Recommendation API",
    version="1.0.0"
)

app.include_router(router)

@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return { "status": "ok" }
