---
name: Django REST Best Practices
description: Guidelines for Django and Django REST Framework to ensure stability, proper migrations, and consistency.
---

# Django & DRF Best Practices

This skill provides guidelines and checklists to avoid common errors in the Duke Burgers backend.

## 1. Migrations Management
- **ALWAYS** run `python manage.py makemigrations` after any change to `models.py`.
- **CHECK** that current migrations are pushed to the repository before finalizing a task.
- **NEVER** modify an existing migration file that has already been pushed to production. Create a new one.

## 2. Model Integrity
- Ensure related names are descriptive (e.g., `related_name='items'`).
- Use `on_delete=models.SET_NULL` or `on_delete=models.PROTECT` instead of `CASCADE` for critical historical data like Sales or Inventory items if they shouldn't be deleted when a product is removed.
- Default values should be consistent between Django and the database level.

## 3. Serializer & View Patterns
- Use `get_serializer_class` in ViewSets to separate `create` (write) views from `list/retrieve` (read) views when metadata differs.
- Always include validation in serializers for required fields to prevent 500 Internal Server Errors due to database constraint violations.
- Prefer `ReadOnlyField` or `SerializerMethodField` for nested data that doesn't need to be written back.

## 4. Streaming & Concurrency (Critical)
- **Async Views**: All streaming views (SSE) like `OrderStreamView` **MUST** be `async def`.
- **Iterators**: Use `.aiter()` on QuerySets inside async streaming loops to avoid blocking.
- **Workers**: Deploy with `gthread` workers in Gunicorn (`--threads 12`) to allow concurrent streaming connections without exhausting server capacity.
- **Buffering**: Set `X-Accel-Buffering: no` and `Content-Encoding: none` headers in streaming responses to bypass proxy buffering.

## 5. Deployment & Infrastructure
- **Git Push**: Deployment in Coolify/Vercel is triggered by Git. **ALWAYS** commit and push changes for them to take effect.
- **Port**: The backend listens on port **3000** for Docker/Coolify compatibility.
- **Storage**: Use `env.bool('USE_S3')` for Supabase S3. Provide defaults for AWS keys to prevent boot crashes if env vars are missing.
