from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file='.env', env_file_encoding='utf-8')

    db_file_path: str

settings = Settings()