from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwner(BasePermission):
    def has_permission(self, request, view):
        # Demo accounts can only use safe, read-only HTTP methods.
        if getattr(request.user, "is_demo", False):
            return request.method in SAFE_METHODS

        return True

    def has_object_permission(self, request, view, obj):
        # Demo accounts cannot modify or delete objects.
        if getattr(request.user, "is_demo", False):
            return request.method in SAFE_METHODS

        if hasattr(obj, "user"):
            return obj.user == request.user

        if hasattr(obj, "habit"):
            return obj.habit.user == request.user

        return False
