from fastapi import FastAPI

from src.controllers import auth, recipes
from src.logger import get_logger

app = FastAPI()
app.include_router(auth)
app.include_router(recipes)

logger = get_logger(__name__)
