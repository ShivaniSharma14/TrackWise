from django.utils import timezone
from datetime import timedelta

def get_habit_streak_data(habit):
    target_value = habit.target_value
    habit_start_date = habit.start_date

    if not habit.is_active:
        return {
            "current_streak": 0,
            "today_status": "inactive"
        }

    if habit.frequency != "DAILY":
        return {
            "current_streak": 0,
            "today_status": "unsupported"
        }

    today = timezone.localdate()

    logs_by_date = {
        log.date: log
        for log in habit.logs.all()
    }

    todays_log = logs_by_date.get(today)

    if todays_log and todays_log.value >= target_value:
        today_status = "completed"
        current_day = today
    else:
        today_status = "pending"
        current_day = today - timedelta(days=1)

    streak = 0

    while current_day >= habit_start_date:
        log = logs_by_date.get(current_day)

        if not log:
            break

        if log.value < target_value:
            break

        streak += 1
        current_day -= timedelta(days=1)

    return {
        "current_streak": streak,
        "today_status": today_status
    }           
        
        
        
