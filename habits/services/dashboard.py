from django.utils import timezone
from datetime import timedelta
from habits.models import Habit


def get_active_daily_habits(user):
    habits = Habit.objects.filter(
        user=user, is_active=True, frequency="DAILY"
    ).prefetch_related("logs")
    return habits


def build_logs_map(habits):
    logs_map = {}

    for habit in habits:
        logs_map[habit.id] = {log.date: log for log in habit.logs.all()}

    return logs_map


def is_habit_completed_on_day(habit, logs_map, day):
    log = logs_map.get(habit.id, {}).get(day)

    if not log:
        return False

    return log.value >= habit.target_value


def get_day_summary(habits, day, logs_map):
    due_habits = 0
    completed_habits = 0

    for habit in habits:
        if habit.start_date <= day:
            due_habits += 1

            if is_habit_completed_on_day(habit, logs_map, day):
                completed_habits += 1

    pending_habits = due_habits - completed_habits

    if due_habits > 0:
        completion_rate = round((completed_habits / due_habits) * 100, 2)
    else:
        completion_rate = 0

    is_perfect_day = due_habits > 0 and due_habits == completed_habits

    return {
        "date": str(day),
        "due_habits": due_habits,
        "completed_habits": completed_habits,
        "pending_habits": pending_habits,
        "completion_rate": completion_rate,
        "is_perfect_day": is_perfect_day,
    }


def get_first_tracked_day(habits, today):
    if not habits:
        return today

    return min(habit.start_date for habit in habits)


def get_days_with_activity(habits, logs_map):
    activity_days = set()

    for habit in habits:
        for log_date in logs_map.get(habit.id, {}):
            activity_days.add(log_date)

    return len(activity_days)


def get_current_perfect_day_streak(habits, logs_map, today):
    streak = 0
    day = today

    while True:
        summary = get_day_summary(habits, day, logs_map)

        if summary["is_perfect_day"]:
            streak += 1
            day -= timedelta(days=1)
        else:
            break

    return streak


def get_best_perfect_day_streak(habits, logs_map, first_tracked_day, today):
    best_streak = 0
    current_streak = 0
    day = first_tracked_day

    while day <= today:
        summary = get_day_summary(habits, day, logs_map)

        if summary["is_perfect_day"]:
            current_streak += 1
            best_streak = max(best_streak, current_streak)
        else:
            current_streak = 0

        day += timedelta(days=1)

    return best_streak


def get_performance_summary(habits, logs_map, first_tracked_day, today):
    tracked_days = 0
    perfect_days_count = 0
    incomplete_days_count = 0
    total_due_instances = 0
    total_completed_instances = 0

    day = first_tracked_day

    while day <= today:
        summary = get_day_summary(habits, day, logs_map)

        if summary["due_habits"] > 0:
            tracked_days += 1
            total_due_instances += summary["due_habits"]
            total_completed_instances += summary["completed_habits"]

            if summary["is_perfect_day"]:
                perfect_days_count += 1
            else:
                incomplete_days_count += 1

        day += timedelta(days=1)

    if total_due_instances > 0:
        overall_completion_rate = round(
            (total_completed_instances / total_due_instances) * 100, 2
        )
    else:
        overall_completion_rate = 0

    return {
        "tracked_days": tracked_days,
        "perfect_days_count": perfect_days_count,
        "incomplete_days_count": incomplete_days_count,
        "overall_completion_rate": overall_completion_rate,
    }


def get_last_7_days_trend(habits, logs_map, today):
    trend = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        trend.append(get_day_summary(habits, day, logs_map))

    return trend


def empty_dashboard_response():
    return {
        "today": {
            "due_habits": 0,
            "completed_habits": 0,
            "pending_habits": 0,
            "completion_rate": 0,
            "is_perfect_day": False,
        },
        "consistency": {
            "current_perfect_day_streak": 0,
            "best_perfect_day_streak": 0,
            "days_with_activity": 0,
            "tracked_days": 0,
        },
        "performance": {
            "overall_completion_rate": 0,
            "perfect_days_count": 0,
            "incomplete_days_count": 0,
        },
        "trend": {"last_7_days": []},
    }


def get_dashboard_summary(user):
    today = timezone.localdate()
    habits = list(get_active_daily_habits(user))

    if not habits:
        return empty_dashboard_response()

    logs_map = build_logs_map(habits)
    first_tracked_day = get_first_tracked_day(habits, today)

    today_summary = get_day_summary(habits, today, logs_map)
    days_with_activity = get_days_with_activity(habits, logs_map)
    current_perfect_day_streak = get_current_perfect_day_streak(habits, logs_map, today)
    best_perfect_day_streak = get_best_perfect_day_streak(
        habits, logs_map, first_tracked_day, today
    )
    performance = get_performance_summary(habits, logs_map, first_tracked_day, today)
    last_7_days = get_last_7_days_trend(habits, logs_map, today)

    return {
        "today": today_summary,
        "consistency": {
            "current_perfect_day_streak": current_perfect_day_streak,
            "best_perfect_day_streak": best_perfect_day_streak,
            "days_with_activity": days_with_activity,
            "tracked_days": performance["tracked_days"],
        },
        "performance": {
            "overall_completion_rate": performance["overall_completion_rate"],
            "perfect_days_count": performance["perfect_days_count"],
            "incomplete_days_count": performance["incomplete_days_count"],
        },
        "trend": {"last_7_days": last_7_days},
    }
