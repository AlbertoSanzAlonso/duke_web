#!/bin/bash

# Duke Burger Autostart Script
# 1. Run migrations for data consistency
echo "🚀 Running database migrations..."
python manage.py migrate --noinput

# 2. Start the server using Gunicorn (Gthread workers for SSE support)
echo "🔥 Starting Gunicorn server on port 3000..."
gunicorn -k gthread --threads 12 --workers 2 --bind 0.0.0.0:3000 --timeout 120 config.wsgi:application
