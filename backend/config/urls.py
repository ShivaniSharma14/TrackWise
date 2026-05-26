"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from config.dashboard import (
    CombinedDashboardView,
    HabitProgressView,
    ExpenseTrendView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/expenses/", include("expenses.urls")),
    path("api/habits/", include("habits.urls")),
    path(
        "api/dashboard/summary/",
        CombinedDashboardView.as_view(),
        name="combined-dashboard",
    ),
    path(
        "api/dashboard/habit-progress/",
        HabitProgressView.as_view(),
        name="habit-progress",
    ),
    path(
        "api/dashboard/expense-trend/",
        ExpenseTrendView.as_view(),
        name="expense-trend",
    ),
]
