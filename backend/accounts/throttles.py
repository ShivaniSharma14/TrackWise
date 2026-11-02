from rest_framework.permissions import SAFE_METHODS
from rest_framework.throttling import UserRateThrottle


class DemoWriteThrottle(UserRateThrottle):
    scope = "demo_write"

    def allow_request(self, request, view):
        if not getattr(request.user, "is_demo", False) or request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)
