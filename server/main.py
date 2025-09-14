from fastapi import FastAPI

from src.controllers import activity, auth, notifications, recipes, sharing, users
from src.logger import get_logger

app = FastAPI()


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth)
app.include_router(recipes)
app.include_router(users)
app.include_router(sharing)
app.include_router(activity)
app.include_router(notifications)

logger = get_logger(__name__)
