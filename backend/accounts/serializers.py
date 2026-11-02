from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from django.utils import timezone

from .demo_workspace import DEMO_EMAIL_PREFIX, demo_expires_at, is_demo_workspace_expired


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_demo:
            raise InvalidToken("Demo workspaces must be started using the demo endpoint.")
        return data


class DemoAwareTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.payload.get(
            settings.SIMPLE_JWT.get("USER_ID_CLAIM", "user_id")
        )
        try:
            user = User.objects.get(
                **{settings.SIMPLE_JWT.get("USER_ID_FIELD", "id"): user_id}
            )
        except User.DoesNotExist as error:
            raise InvalidToken("No active account found for the given token.") from error

        if user.is_demo:
            if (
                not user.email.startswith(DEMO_EMAIL_PREFIX)
                or is_demo_workspace_expired(user)
            ):
                raise InvalidToken("Demo workspace expired or invalid.")

            data = super().validate(attrs)
            expires_in = demo_expires_at(user) - timezone.now()
            access = AccessToken(data["access"])
            access.set_exp(
                from_time=timezone.now(),
                lifetime=min(
                    settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
                    expires_in,
                ),
            )
            data["access"] = str(access)
            return data

        return super().validate(attrs)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(
            email=validated_data.get("email"),
            password=password,
            first_name=validated_data.get("first_name"),
            last_name=validated_data.get("last_name", ""),
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    demo_expires_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "is_demo", "demo_expires_at"]
        read_only_fields = ["id", "is_demo", "demo_expires_at"]

    def get_demo_expires_at(self, user):
        if not user.is_demo or not user.email.startswith(DEMO_EMAIL_PREFIX):
            return None
        return demo_expires_at(user)