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

## 4. Error Handling
- Wrap complex DB transactions in `transaction.atomic()` to prevent partial data writes (especially in Sale/Order creation).
- Return clear error messages in serializers using `serializers.ValidationError`.

## 5. Deployment Check
- Ensure `ALLOWED_HOSTS` includes both the frontend and backend domains.
- Confirm `VITE_API_URL` is set correctly in the frontend environment without a trailing slash.
