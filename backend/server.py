"""
TaskFlow - Python FastAPI Proxy
Forwards all /api requests to Node.js backend on port 8002
Also manages starting the Node.js server as a subprocess
"""
import subprocess
import sys
import os
import time
import signal
import threading
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TaskFlow Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NODE_BASE = "http://localhost:8002"
node_process = None


def ensure_postgres():
    try:
        result = subprocess.run(["pg_isready", "-h", "localhost"], capture_output=True, timeout=5)
        if result.returncode != 0:
            subprocess.run(["pg_ctlcluster", "15", "main", "start"], capture_output=True, timeout=30)
            time.sleep(2)
            print("PostgreSQL started", flush=True)
    except Exception as e:
        print(f"PostgreSQL check: {e}", flush=True)


def start_node_server():
    global node_process
    ensure_postgres()
    node_dir = "/app/nodebackend"
    env = os.environ.copy()
    env["NODE_PORT"] = "8002"
    env["PG_HOST"] = "localhost"
    env["PG_DATABASE"] = "taskmanagement"
    env["PG_USER"] = "taskadmin"
    env["PG_PASSWORD"] = "taskpass123"
    env["PG_PORT"] = "5432"
    env["JWT_SECRET"] = "taskflow_secret_key_enterprise_2024"

    try:
        node_process = subprocess.Popen(
            ["node", "server.js"],
            cwd=node_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )

        def log_output():
            for line in iter(node_process.stdout.readline, b''):
                print(f"[NODE] {line.decode().strip()}", flush=True)

        t = threading.Thread(target=log_output, daemon=True)
        t.start()
        time.sleep(2)
        print("Node.js server started", flush=True)
    except Exception as e:
        print(f"Failed to start Node.js: {e}", flush=True)


@app.on_event("startup")
async def startup():
    start_node_server()


@app.on_event("shutdown")
async def shutdown():
    if node_process:
        node_process.terminate()


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(request: Request, path: str):
    url = f"{NODE_BASE}/api/{path}"
    params = dict(request.query_params)
    headers = {k: v for k, v in request.headers.items()
               if k.lower() not in ("host", "content-length")}

    try:
        body = await request.body()
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(
                method=request.method,
                url=url,
                params=params,
                headers=headers,
                content=body
            )
        resp_headers = {k: v for k, v in resp.headers.items()
                        if k.lower() not in ("content-encoding", "transfer-encoding")}
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers=resp_headers,
            media_type=resp.headers.get("content-type", "application/json")
        )
    except httpx.ConnectError:
        return Response(content='{"message":"Backend service unavailable"}', status_code=503,
                        media_type="application/json")
    except Exception as e:
        return Response(content=f'{{"message":"{str(e)}"}}', status_code=500,
                        media_type="application/json")


@app.get("/health")
async def health():
    return {"status": "ok", "proxy": "active"}
