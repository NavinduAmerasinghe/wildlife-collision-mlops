"""
Configuration settings for the Wildlife Collision MLOps backend.
"""

from pydantic import BaseSettings

class Settings(BaseSettings):
    env: str = "development"
    log_level: str = "info"

    class Config:
        env_file = ".env"

settings = Settings()
