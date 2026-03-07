from rest_framework import serializers
from .models import Habit, HabitLog

class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = "__all__"
        read_only_fields = ['user','created_at','updated_at']


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = "__all__"
        read_only_fields = ['created_at','updated_at']
    def validate_habit(self, value):
        request = self.context.get('request')
        if not request or value.user != request.user:
            raise serializers.ValidationError("You can only log your own habits.")
        return value
