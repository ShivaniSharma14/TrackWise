from django.urls import path
from accounts import views
from .views import (
    DemoAwareTokenRefreshView,
    DemoResetView,
    EmailTokenObtainPairView,
    ProfileView,
)

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register_view"),
    path("login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("refresh/", DemoAwareTokenRefreshView.as_view(), name="refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("demo/", views.DemoLoginView.as_view(), name="demo_login"),
    path("demo/reset/", DemoResetView.as_view(), name="demo_reset"),
]