from django.shortcuts import render
from rest_framework import viewsets
from .models import Expense
from .serializers import ExpenseSerializer
from rest_framework.permissions import IsAuthenticated
from .permissions import IsOwner

# Create your views here.
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    # only logged in user expenses 
    def get_queryset(self):
        return Expense.objects.filter(user = self.request.user).order_by('-date','-created_at')
    
    # ownership enforcement 
    def perform_create(self, serializer):
        serializer.save(user = self.request.user)
    
