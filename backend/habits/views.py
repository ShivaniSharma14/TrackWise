from rest_framework.response import Response
from .models import Habit, HabitLog
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from expenses.permissions import IsOwner
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from .serializers import HabitSerializer, HabitLogSerializer
from .services import streaks, stats, dashboard
from django.utils import timezone


# Create your views here.
class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HabitLogViewSet(viewsets.ModelViewSet):
    serializer_class = HabitLogSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return HabitLog.objects.filter(habit__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()


class HabitLogsByHabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitLogSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        habit_id = self.kwargs.get("habit_id")
        return HabitLog.objects.filter(
            habit__id=habit_id, habit__user=self.request.user
        )

    def perform_create(self, serializer):
        habit_id = self.kwargs.get("habit_id")
        habit = get_object_or_404(Habit, id=habit_id, user=self.request.user)
        serializer.save()


class HabitStreakAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        habit = get_object_or_404(Habit, id=id, user=request.user)
        streak_data = streaks.get_habit_streak_data(habit)

        return Response({"habit_id": habit.id, "habit_name": habit.name, **streak_data})


class HabitStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        habit = get_object_or_404(Habit, id=id, user=request.user)
        stat_data = stats.get_habit_stats(habit)
        return Response({"habit_id": habit.id, "habit_name": habit.name, **stat_data})


class TodayHabitsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        habits = Habit.objects.filter(
            user=request.user, is_active=True, start_date__lte=today
        )

        habits_data = []
        for habit in habits:
            logs = HabitLog.objects.filter(habit=habit, date=today)
            serializer = HabitSerializer(habit)
            habit_dict = serializer.data
            habit_dict["logs"] = HabitLogSerializer(logs, many=True).data
            habits_data.append(habit_dict)

        return Response({"date": today, "habits": habits_data})


class DashboardSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = dashboard.get_dashboard_summary(request.user)
        return Response(data)
