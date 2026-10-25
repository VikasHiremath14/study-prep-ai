"""
StudyPrep.AI One-Click Launcher
Starts both Backend (FastAPI) and Frontend (Vite + React), then automatically opens the UI in your browser.
"""

import os
import sys
import time
import signal
import subprocess
import threading
import webbrowser


def kill_process_on_port(port: int):
    """Frees up a port if already occupied by a previous process."""
    try:
        res = subprocess.run(["lsof", "-t", f"-i:{port}"], capture_output=True, text=True)
        pids = res.stdout.strip().split()
        my_pid = str(os.getpid())
        for pid in pids:
            if pid and pid != my_pid:
                subprocess.run(["kill", "-9", pid], check=False)
    except Exception:
        pass


def open_browser_after_delay(url: str, delay: float = 1.8):
    """Waits for servers to initialize, then opens the browser window."""
    time.sleep(delay)
    print(f"\n🌐 Opening StudyPrep.AI in your browser: {url} ...\n")
    try:
        if sys.platform == "darwin":
            subprocess.run(["open", url], check=False)
        else:
            webbrowser.open(url)
    except Exception as e:
        print(f"Note: Could not open browser automatically: {e}. Please visit {url} directly.")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    frontend_port = 8080
    backend_port = 8000
    frontend_url = f"http://localhost:{frontend_port}"
    backend_docs_url = f"http://localhost:{backend_port}/docs"

    print("=" * 55)
    print(" 🧠 Starting StudyPrep.AI Autonomous Multi-Agent System ")
    print("=" * 55)

    # Free ports if bound
    kill_process_on_port(backend_port)
    kill_process_on_port(frontend_port)

    # Locate Python executable
    venv_python = os.path.join(script_dir, "backend", ".venv", "bin", "python")
    python_bin = venv_python if os.path.exists(venv_python) else sys.executable

    # Environment with PYTHONPATH
    env = os.environ.copy()
    env["PYTHONPATH"] = script_dir

    processes = []

    # 1. Start Backend
    print(f"⚙️  1. Launching Backend (FastAPI) on port {backend_port}...")
    backend_cmd = [
        python_bin,
        "-m",
        "uvicorn",
        "backend.app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(backend_port),
        "--reload"
    ]
    backend_proc = subprocess.Popen(backend_cmd, env=env)
    processes.append(backend_proc)

    # 2. Start Frontend
    print(f"🎨 2. Launching Frontend (React + Vite) on port {frontend_port}...")
    frontend_cmd = ["npm", "--prefix", "frontend", "run", "dev"]
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=script_dir)
    processes.append(frontend_proc)

    # 3. Open Browser
    browser_thread = threading.Thread(
        target=open_browser_after_delay,
        args=(frontend_url, 1.8),
        daemon=True
    )
    browser_thread.start()

    print("\n🚀 Servers active:")
    print(f"   • Frontend UI:    {frontend_url}")
    print(f"   • Backend API:   http://localhost:{backend_port}")
    print(f"   • API Docs:      {backend_docs_url}")
    print("\nPress Ctrl+C to terminate all services.\n")

    def shutdown(signum=None, frame=None):
        print("\n👋 Shutting down StudyPrep.AI servers...")
        for p in processes:
            try:
                p.terminate()
                p.wait(timeout=2)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
