from rest_framework.throttling import AnonRateThrottle
from rest_framework.throttling import UserRateThrottle
from .models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    DemoAwareTokenRefreshSerializer,
    RegisterSerializer,
    EmailTokenObtainPairSerializer,
    UserProfileSerializer,
)
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .demo_workspace import (
    DEMO_EMAIL_PREFIX,
    DEMO_TTL,
    create_demo_workspace,
    demo_expires_at,
    is_demo_workspace_expired,
    reset_demo_workspace,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(
                {"message": "User successfully registered."},
                status=status.HTTP_201_CREATED,
            )
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


class DemoAwareTokenRefreshView(TokenRefreshView):
    serializer_class = DemoAwareTokenRefreshSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]


    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"error": "This field is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh)
            user_claim = settings.SIMPLE_JWT.get("USER_ID_CLAIM", "user_id")
            if str(token.get(user_claim)) != str(request.user.pk):
                return Response(
                    {"detail": "Refresh token does not belong to this session."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            token.blacklist()
        except TokenError:
            return Response(
                {"error": "Invalid or expired refresh token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Logged out successfully"}, status=status.HTTP_200_OK
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        if getattr(request.user, "is_demo", False):
            return Response(
                {"detail": "The demo account is read-only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DemoLoginThrottle(AnonRateThrottle):
    scope = "demo_login"


class DemoResetThrottle(UserRateThrottle):
    scope = "demo_reset"


class DemoLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [DemoLoginThrottle]

    def post(self, request):
        user = create_demo_workspace()
        now = timezone.now()
        expires_in = demo_expires_at(user) - now
        refresh = RefreshToken.for_user(user)
        refresh.set_exp(from_time=now, lifetime=expires_in)

        access = refresh.access_token
        access.set_exp(
            from_time=now,
            lifetime=min(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"], expires_in),
        )

        return Response(
            {
                "access": str(access),
                "refresh": str(refresh),
                "expires_at": demo_expires_at(user),
            },
            status=status.HTTP_201_CREATED,
        )


class DemoResetView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [DemoResetThrottle]

    @transaction.atomic
    def post(self, request):
        user = User.objects.select_for_update().get(pk=request.user.pk)
        if (
            not user.is_demo
            or not user.email.startswith(DEMO_EMAIL_PREFIX)
            or is_demo_workspace_expired(user)
        ):
            return Response(
                {"detail": "An active demo workspace is required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            reset_demo_workspace(user)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_403_FORBIDDEN)

        return Response(
            {
                "message": "Demo workspace reset.",
                "expires_at": demo_expires_at(user),
            },
            status=status.HTTP_200_OK,
        )