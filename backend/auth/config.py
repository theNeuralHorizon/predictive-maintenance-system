
from pydantic import BaseConfig
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    JWT_SECRET_KEY: str = "changethis"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        extra = "ignore" 

settings = Settings()
