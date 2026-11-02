from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.demo_workspace import DEMO_EMAIL_PREFIX, is_demo_workspace_expired


class DemoJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user.is_demo and (
            not user.email.startswith(DEMO_EMAIL_PREFIX)
            or is_demo_workspace_expired(user)
        ):
            raise AuthenticationFailed("Demo workspace expired or invalid.")

        return user