from django.shortcuts import render
from .models import Habit, HabitLog
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from expenses.permissions import IsOwner
from .serializers import HabitSerializer, HabitLogSerializer

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

