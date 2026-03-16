from rest_framework.response import Response
from .models import Habit, HabitLog
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from expenses.permissions import IsOwner
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from .serializers import HabitSerializer, HabitLogSerializer
from rest_framework import response
from .services import streaks, stats, dashboard

# Create your views here.
class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

        
    def perform_create(self, serializer):
        serializer.save(user = self.request.user)

class HabitLogViewSet(viewsets.ModelViewSet):
    serializer_class=HabitLogSerializer
    permission_classes=[IsAuthenticated, IsOwner]

    def get_queryset(self):
        return HabitLog.objects.filter(habit__user=self.request.user)
    
    def perform_create(self, serializer):
        
        
        serializer.save()



class HabitStreakAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
    
        habit = get_object_or_404(Habit, id=id, user=request.user)
        streak_data = streaks.get_habit_streak_data(habit)

        return Response({
    "habit_id": habit.id,
    "habit_name": habit.name,
    **streak_data
})


class HabitStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request, id):

        habit = get_object_or_404(Habit, id=id, user=request.user)
        stat_data = stats.get_habit_stats(habit)
        return Response(
            {
            'habit_id':habit.id,
            'habit_name':habit.name,
            **stat_data
           
        }
        )
    
class DashboardSummaryAPIView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        data = dashboard.get_dashboard_summary(request.user)
        return Response(data)