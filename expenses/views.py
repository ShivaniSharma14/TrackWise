from django.shortcuts import render
from rest_framework import viewsets
from .models import Expense
from .serializers import ExpenseSerializer
from rest_framework.permissions import IsAuthenticated
from .permissions import IsOwner
from .filters import ExpenseFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

# Create your views here.
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ExpenseFilter
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date", "-created_at"]

    # only logged in user expenses 
    def get_queryset(self):
        return Expense.objects.filter(user = self.request.user).order_by('-date','-created_at')
    
    # ownership enforcement 
    def perform_create(self, serializer):
        serializer.save(user = self.request.user)
    
