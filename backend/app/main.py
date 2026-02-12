import os
import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.api.routes import router as api_router

app = FastAPI(title="Heat Load Calc API", version="0.1.0")


# Dynamic CORS origin validator for Vercel preview and production domains
class DynamicCORSMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_patterns: list[str], allow_credentials: bool = True):
        super().__init__(app)
        self.allowed_patterns = [re.compile(pattern) for pattern in allowed_patterns]
        self.allow_credentials = allow_credentials

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")

        # Check if origin matches any allowed pattern
        is_allowed = False
        if origin:
            for pattern in self.allowed_patterns:
                if pattern.match(origin):
                    is_allowed = True
                    break

        response = await call_next(request)

        # Add CORS headers if origin is allowed
        if is_allowed and origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"

        return response


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
    # Parse origins and check for patterns
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

    # Separate exact origins from patterns
    exact_origins = []
    pattern_origins = []

    for origin in origins:
        if "*" in origin:
            # Convert wildcard pattern to regex
            # e.g., https://*.vercel.app -> ^https://.*\.vercel\.app$
            pattern = origin.replace(".", r"\.").replace("*", ".*")
            pattern = f"^{pattern}$"
            pattern_origins.append(pattern)
        else:
            exact_origins.append(origin)

    # If there are patterns, use dynamic CORS middleware
    if pattern_origins:
        # Also include exact origins in patterns
        for exact in exact_origins:
            pattern_origins.append(f"^{re.escape(exact)}$")

        app.add_middleware(DynamicCORSMiddleware, allowed_patterns=pattern_origins)
    else:
        # Use standard CORS middleware for exact origins
        app.add_middleware(
            CORSMiddleware,
            allow_origins=exact_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

app.include_router(api_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
