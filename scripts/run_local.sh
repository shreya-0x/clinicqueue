#!/usr/bin/env bash
set -e

echo "========================================================"
echo "Starting ClinicQueue - Full-Stack Local Execution"
echo "========================================================"

export PYTHONPATH=.
python3 -m backend.app &
BACKEND_PID=$!

echo "[1/2] Flask API started on http://localhost:5000 (PID $BACKEND_PID)"

cd frontend
npm run dev

kill $BACKEND_PID
