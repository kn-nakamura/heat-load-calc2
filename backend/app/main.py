import os
import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router

app = FastAPI(title="Heat Load Calc API", version="0.1.0")


# Get CORS origins from environment
cors_origins_env = os.environ.get("CORS_ORIGINS", "*")

# If wildcard, use standard CORS middleware
if cors_origins_env == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Cannot use credentials with wildcard
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Parse origins and convert wildcard entries to allow_origin_regex.
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    exact_origins: list[str] = []
    pattern_origins: list[str] = []

    for origin in origins:
        if "*" in origin:
            pattern_origins.append(origin.replace(".", r"\.").replace("*", ".*"))
        else:
            exact_origins.append(origin)

    allow_origin_regex = None
    if pattern_origins:
        all_patterns = pattern_origins + [re.escape(origin) for origin in exact_origins]
        allow_origin_regex = f"^({'|'.join(all_patterns)})$"

    app.add_middleware(
        CORSMiddleware,
        allow_origins=exact_origins,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
