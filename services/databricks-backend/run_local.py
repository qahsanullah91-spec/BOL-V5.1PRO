"""
Local runner for Sky Databricks Apps Backend.
Auto-detects available port (prefers 8000, falls back to 8008 or 8080).
"""
import os
import socket
import sys
from pathlib import Path

def find_available_port(preferred_ports=[8000, 8008, 8080, 8888]):
    for port in preferred_ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return 8008

if __name__ == '__main__':
    selected_port = int(os.getenv("PORT", find_available_port()))
    print(f"[RUNNER] Starting Databricks Apps Backend on 127.0.0.1:{selected_port}...")
    import uvicorn
    # Add backend dir to sys.path
    backend_dir = Path(__file__).parent.resolve()
    sys.path.insert(0, str(backend_dir))
    uvicorn.run("main:app", host="127.0.0.1", port=selected_port, reload=False, log_level="info")
