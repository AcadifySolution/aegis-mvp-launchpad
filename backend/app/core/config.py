import os


APP_ENV = os.getenv("APP_ENV", "development").lower()
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]
MAX_DESCRIPTION_LENGTH = int(os.getenv("MAX_DESCRIPTION_LENGTH", "20000"))
MAX_PROJECT_LOGS = int(os.getenv("MAX_PROJECT_LOGS", "250"))
API_KEY = os.getenv("AEGIS_API_KEY", "")
