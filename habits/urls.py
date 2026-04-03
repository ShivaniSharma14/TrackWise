from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HabitViewSet,
    HabitLogViewSet,
    HabitStreakAPIView,
    HabitStatsAPIView,
    DashboardSummaryAPIView,
)

router = DefaultRouter()
router.register(r"logs", HabitLogViewSet, basename="habit-log")
router.register(r"", HabitViewSet, basename="habit")


urlpatterns = [
    path("", include(router.urls)),
    path("<int:id>/streak/", HabitStreakAPIView.as_view(), name="habit-streak"),
    path("<int:id>/stats/", HabitStatsAPIView.as_view(), name="habit-stats"),
    path(
        "dashboard/summary/",
        DashboardSummaryAPIView.as_view(),
        name="dashboard-summary",
    ),
]
