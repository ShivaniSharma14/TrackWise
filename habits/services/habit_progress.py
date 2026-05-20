from django.utils import timezone
from datetime import timedelta
from habits.models import Habit, HabitLog


def get_habit_progress_trend(user, days=7):
    """Get habit completion progress for the last N days."""
    today = timezone.localdate()
    start_date = today - timedelta(days=days - 1)

    habits = Habit.objects.filter(
        user=user, is_active=True, start_date__lte=today
    ).prefetch_related("logs")

    if not habits:
        return {"days": days, "trend": []}

    logs_map = {}
    for habit in habits:
        logs_map[habit.id] = {log.date: log for log in habit.logs.all()}

    trend = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)

        if day < start_date:
            continue

        due_habits = 0
        completed_habits = 0

        for habit in habits:
            if habit.start_date <= day:
                due_habits += 1
                log = logs_map.get(habit.id, {}).get(day)
                if log and log.value >= habit.target_value:
                    completed_habits += 1

        if due_habits > 0:
            completion_rate = round((completed_habits / due_habits) * 100, 2)
        else:
            completion_rate = 0

        trend.append({
            "date": str(day),
            "due_habits": due_habits,
            "completed_habits": completed_habits,
            "completion_rate": completion_rate,
        })

    return {
        "days": days,
        "trend": trend,
    }
