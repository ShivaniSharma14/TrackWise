from django.db import models
from django.conf import settings
from django.db.models import UniqueConstraint

class Habit(models.Model):
    FREQUENCY_CHOICES = [
        ("DAILY", "Daily"),
        ("WEEKLY", "Weekly")
    ]
    TARGET_UNIT_CHOICES = [
        ("MINUTES","Minutes"),
        ("COUNT","Count"),
        ("BOOL","Yes/No")
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habits"
    )
    name = models.CharField(max_length=100)
    frequency = models.CharField(max_length=15,choices=FREQUENCY_CHOICES, default="DAILY")
    target_value = models.PositiveIntegerField()
    target_unit = models.CharField(max_length=15,choices=TARGET_UNIT_CHOICES, default="COUNT")
    start_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} • {self.name} ({self.get_frequency_display()})"


class HabitLog(models.Model):
    habit = models.ForeignKey(
        Habit, on_delete=models.CASCADE,
        related_name="logs")
    date = models.DateField()
    value = models.PositiveIntegerField(default=0)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints =[
            UniqueConstraint(
                fields=['habit','date'],
                name="unique_habit_log_per_day"
            )
        ]

    def __str__(self):
        return f"{self.habit.name} • {self.date} • value={self.value} {self.habit.get_target_unit_display()}"
