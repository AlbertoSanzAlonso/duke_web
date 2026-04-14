from rest_framework import permissions

class IsAdminManager(permissions.BasePermission):
    """
    Allows access only to superusers or users with is_admin_manager=True in their profile.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Superuser always has access
        if request.user.is_superuser:
            return True
        # Check profile permission
        return hasattr(request.user, 'profile') and request.user.profile.is_admin_manager

class HasTPVPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.can_use_tpv)

class HasAccountingPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.can_use_accounting)

class HasMenuPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or (hasattr(request.user, 'profile') and (request.user.profile.can_use_menu or request.user.profile.can_use_promos))

class HasInventoryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.can_use_inventory)

class HasGalleryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.can_use_gallery)

class HasKitchenPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or (hasattr(request.user, 'profile') and request.user.profile.can_use_kitchen)
