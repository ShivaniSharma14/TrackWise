from rest_framework.throttling import AnonRateThrottle
from .models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer, EmailTokenObtainPairSerializer, UserProfileSerializer
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


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


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]


    def post(self, request):

        refresh = request.data.get("refresh")

        if getattr(request.user, "is_demo", False):
            return Response({"detail": "Demo session ended."}, status=status.HTTP_200_OK)

        if not refresh:
            return Response(
                {"error": "This field is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh)
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


class DemoLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [DemoLoginThrottle]

    def post(self, request):
        user = User.objects.filter(is_demo=True).first()

        if user is None:
            return Response(
                {"detail": "Demo is not available yet."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })