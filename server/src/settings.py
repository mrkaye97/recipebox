from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: SecretStr = SecretStr("sqlite:///./recipebox.db")
    anthropic_api_key: SecretStr = SecretStr(
        "your-anthropic-api-key-change-this-in-production"
    )

    jwt_secret_key: SecretStr = SecretStr("your-secret-key-change-this-in-production")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24 * 7 * 52  ## 1 year

    signup_token: SecretStr = SecretStr("secret-signup-token")


settings = Settings()
