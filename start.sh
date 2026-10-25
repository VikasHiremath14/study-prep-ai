#!/bin/bash
# StudyPrep.AI unified startup script

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Ensure virtualenv exists
if [ ! -d "backend/.venv" ]; then
    echo "Creating virtual environment in backend/.venv..."
    python3 -m venv backend/.venv
    ./backend/.venv/bin/pip install -r backend/requirements.txt
fi

echo "=========================================="
echo " Starting StudyPrep.AI Multi-Agent System "
echo "=========================================="

export PYTHONPATH="$PROJECT_ROOT"

echo "1. Starting Backend on http://localhost:8000..."
./backend/.venv/bin/python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "2. Starting Frontend on http://localhost:8080..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "🚀 Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)"
echo "🚀 Frontend: http://localhost:8080"
echo "Press Ctrl+C to stop both servers."

# Automatically open UI in default browser on macOS
if command -v open >/dev/null 2>&1; then
    (sleep 1.5 && open "http://localhost:8080") &
fi

wait
