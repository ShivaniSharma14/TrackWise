from rest_framework import serializers
from .models import Habit, HabitLog
from django.utils import timezone
from rest_framework import serializers
from accounts.demo_workspace import MAX_DEMO_HABITS


class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = "__all__"
        read_only_fields = ["user", "created_at", "updated_at"]

    def validate_target_value(self, value):
        if value < 1:
            raise serializers.ValidationError("Target value must be at least 1.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if (
            request
            and request.user.is_demo
            and self.instance is None
            and Habit.objects.filter(user=request.user).count() >= MAX_DEMO_HABITS
        ):
            raise serializers.ValidationError(
                {"detail": f"Demo workspaces are limited to {MAX_DEMO_HABITS} habits."}
            )
        return attrs


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]
        # Upsert is handled in create(); skip pre-insert unique_together validation.
        validators = []

    def validate_habit(self, value):
        request = self.context.get("request")
        if not request or value.user != request.user:
            raise serializers.ValidationError("You can only log your own habits.")
        return value

    def validate(self, data):

        log_date = data.get("date", getattr(self.instance, "date", None))
        habit = data.get("habit", getattr(self.instance, "habit", None))
        if not log_date or not habit:
            raise serializers.ValidationError("incomplete data")
        if habit.start_date > log_date:
            raise serializers.ValidationError("Log date cannot be before start date")
        if not habit.is_active:
            raise serializers.ValidationError("habit must be active.")

        return data

    def validate_date(self, date):
        if date > timezone.localdate():
            raise serializers.ValidationError("Future logs are not allowed.")
        return date

    def create(self, validated_data):
        habit = validated_data["habit"]
        log_date = validated_data["date"]
        log, _created = HabitLog.objects.update_or_create(
            habit=habit,
            date=log_date,
            defaults={
                "value": validated_data.get("value", 0),
                "note": validated_data.get("note", ""),
            },
        )
        return log
