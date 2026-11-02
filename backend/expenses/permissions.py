from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.demo_workspace import DEMO_EMAIL_PREFIX, is_demo_workspace_expired


class IsOwner(BasePermission):
    def has_permission(self, request, view):
        if getattr(request.user, "is_demo", False) and request.method not in SAFE_METHODS:
            return (
                request.user.email.startswith(DEMO_EMAIL_PREFIX)
                and not is_demo_workspace_expired(request.user)
            )

        return True

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "user"):
            return obj.user == request.user

        if hasattr(obj, "habit"):
            return obj.habit.user == request.user

        return False
