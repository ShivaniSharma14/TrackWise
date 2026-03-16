from django.utils import timezone
from datetime import timedelta
from habits.models import Habit

def get_active_daily_habits(user):
    habits = Habit.objects.filter(user=user,is_active=True, 
                                    frequency="DAILY").prefetch_related('logs')
    return habits

def build_logs_map(habits):
    logs_map = {}

    for habit in habits:
        logs_map[habit.id]={
            log.date : log for log in habit.logs.all()
        }
    return logs_map

    
def is_habit_completed_on_day(habit, logs_map, day):
    log = logs_map.get(habit.id,{}).get(day)

    if not log:
        return False
    
    elif log.value>=habit.target_value:
        return True
    else:
        return False
    

def get_day_summary(habits, day, logs_map):
    due_habits = 0
    completed_habits = 0
    for habit in habits:
        if habit.start_date <= day:
            due_habits += 1
            if is_habit_completed_on_day(habit, logs_map, day):
                completed_habits += 1

        
    
    pending_habits = due_habits - completed_habits
    if due_habits>0:
        completion_rate = completed_habits/due_habits *100
    else:
        completion_rate = 0
    
    is_perfect_day = False
    if due_habits>0 and due_habits==completed_habits:
        is_perfect_day = True

    return {
        'due_habits':due_habits,
        'completed_habits':completed_habits,
        'pending_habits':pending_habits,
        'completion_rate':completion_rate,
        'is_perfect_day':is_perfect_day
    }   