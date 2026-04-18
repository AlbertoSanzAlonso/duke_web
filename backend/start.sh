#!/bin/bash

# Duke Burger Autostart Script
# 1. Run migrations for data consistency
echo "🚀 Running database migrations..."
python manage.py migrate --noinput

# 2. Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# 3. Start the server using Uvicorn (ASGI) for async SSE support
echo "🔥 Starting Uvicorn ASGI server on port 3000..."
uvicorn config.asgi:application --host 0.0.0.0 --port 3000 --workers 4 --timeout-keep-alive 75 --log-level warning
