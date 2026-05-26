from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HabitViewSet,
    HabitLogViewSet,
    HabitLogsByHabitViewSet,
    HabitStreakAPIView,
    HabitStatsAPIView,
    TodayHabitsAPIView,
    DashboardSummaryAPIView,
)

router = DefaultRouter()
router.register(r"logs", HabitLogViewSet, basename="habit-log")
router.register(r"", HabitViewSet, basename="habit")


urlpatterns = [
    path("today/", TodayHabitsAPIView.as_view(), name="today-habits"),
    path("", include(router.urls)),
    path("<int:id>/streak/", HabitStreakAPIView.as_view(), name="habit-streak"),
    path("<int:id>/stats/", HabitStatsAPIView.as_view(), name="habit-stats"),
    path("<int:habit_id>/logs/", HabitLogsByHabitViewSet.as_view({"get": "list", "post": "create"}), name="habit-logs-by-habit"),
    path(
        "dashboard/summary/",
        DashboardSummaryAPIView.as_view(),
        name="dashboard-summary",
    ),
]
