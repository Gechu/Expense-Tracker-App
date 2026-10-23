from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    # Lista originów oddzielona przecinkami (np. "https://expense.example.com")
    cors_origins: str = "http://localhost:5173"
    # Ciasteczko z flagą Secure wymaga HTTPS - włączyć na serwerze produkcyjnym
    cookie_secure: bool = False

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
