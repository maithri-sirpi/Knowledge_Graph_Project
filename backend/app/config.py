import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Neo4j Configurations
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"

    # LLM Configurations
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # Server Configurations
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
