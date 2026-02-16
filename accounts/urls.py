from django.urls import path
from accounts import views
from rest_framework_simplejwt.views import TokenRefreshView
from .views import EmailTokenObtainPairView

urlpatterns = [
    path('register/', views.RegisterView.as_view(),name="register_view"),
    path("login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
]
