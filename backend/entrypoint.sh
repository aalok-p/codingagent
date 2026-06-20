#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

if [ "$RUN_SEED" = "true" ]; then
    echo "Seeding test users..."
    python seed.py
fi

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
