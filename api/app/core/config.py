"""Service configuration.

Values are read from the environment with safe defaults, so the service runs
out of the box in development without a .env file while still being fully
configurable in deployment.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VERISIGHT_", env_file=".env")

    app_name: str = "VeriSight Analysis Engine"
    version: str = "0.1.0"

    # The web app is the only intended caller. Listing origins explicitly
    # rather than allowing "*" keeps a stray page on another origin from
    # driving this service through a user's browser.
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Upper bound on what will be decoded. Enforced before any pixel work:
    # image decoders allocate roughly width x height x channels bytes, so an
    # unbounded input is a memory-exhaustion vector regardless of file size.
    max_upload_bytes: int = 25 * 1024 * 1024  # 25 MB
    max_pixels: int = 50_000_000  # ~50 MP

    # Long edge that images are downscaled to before the expensive analyzers.
    # The artefacts these look for are structural and survive downscaling,
    # while runtime scales with pixel count.
    analysis_long_edge: int = 1024


settings = Settings()
