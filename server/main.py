from fastapi import FastAPI

from src.controllers import auth, recipes, sharing, users
from src.logger import get_logger

app = FastAPI()

app.include_router(auth)
app.include_router(recipes)
app.include_router(users)
app.include_router(sharing)

logger = get_logger(__name__)
