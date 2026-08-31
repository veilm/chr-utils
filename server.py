#!/usr/bin/env -S uv run --script
#
# /// script
# dependencies = ["fastapi", "uvicorn[standard]"]
# ///
#
from __future__ import annotations

import os
import subprocess
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

TOKEN_PATH = os.path.expanduser("~/.local/share/.chr-util-token.txt")
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 61483


def load_token(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return handle.read().strip()
    except FileNotFoundError:
        raise SystemExit(f"Token file not found: {path}")


TOKEN = load_token(TOKEN_PATH)

app = FastAPI()


class RunRequest(BaseModel):
    cmd: str
    timeout: Optional[float] = None


class AppendLinesRequest(BaseModel):
    paths: list[str]
    line: str


def require_token(request: Request) -> None:
    token = request.headers.get("x-chr-token", "")
    if not token or token != TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/run")
async def run_command(payload: RunRequest, request: Request) -> JSONResponse:
    require_token(request)
    if not payload.cmd or not payload.cmd.strip():
        raise HTTPException(status_code=400, detail="Missing command")

    started = time.time()
    try:
        result = subprocess.run(
            payload.cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=payload.timeout,
        )
    except subprocess.TimeoutExpired as exc:
        return JSONResponse(
            {
                "ok": False,
                "timeout": True,
                "stdout": exc.stdout or "",
                "stderr": exc.stderr or "",
                "code": None,
                "elapsed": time.time() - started,
                "error": "Command timed out",
            },
            status_code=408,
        )

    return JSONResponse(
        {
            "ok": result.returncode == 0,
            "stdout": result.stdout or "",
            "stderr": result.stderr or "",
            "code": result.returncode,
            "elapsed": time.time() - started,
            "error": None if result.returncode == 0 else "Command failed",
        }
    )


@app.post("/append-lines")
async def append_lines(payload: AppendLinesRequest, request: Request) -> dict:
    require_token(request)
    paths = list(dict.fromkeys(path.strip() for path in payload.paths if path.strip()))
    if not paths:
        raise HTTPException(status_code=400, detail="At least one file path is required")
    if len(paths) > 50:
        raise HTTPException(status_code=400, detail="Too many file paths")
    if "\x00" in payload.line or "\n" in payload.line or "\r" in payload.line:
        raise HTTPException(status_code=400, detail="The appended value must be one line")

    resolved: list[Path] = []
    for raw_path in paths:
        if "\x00" in raw_path:
            raise HTTPException(status_code=400, detail="Invalid file path")
        path = Path(raw_path).expanduser()
        if not path.is_absolute():
            raise HTTPException(status_code=400, detail=f"File path must be absolute: {raw_path}")
        if not path.parent.is_dir():
            raise HTTPException(status_code=400, detail=f"Parent directory does not exist: {path.parent}")
        resolved.append(path)

    try:
        for path in resolved:
            with path.open("a", encoding="utf-8") as handle:
                handle.write(f"{payload.line}\n")
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to append URL: {exc}") from exc
    return {"ok": True, "paths": [str(path) for path in resolved]}


if __name__ == "__main__":
    uvicorn.run(app, host=DEFAULT_HOST, port=DEFAULT_PORT)
