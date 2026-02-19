from rest_framework import serializers
from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id','amount','date','category','note','created_at','updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
