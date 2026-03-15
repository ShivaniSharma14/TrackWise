from django.utils import timezone
from datetime import timedelta
from . import streaks

def get_total_completed_days(habit):
    target_value = habit.target_value
    
    if not habit.is_active:
        return {
            'total_completed_days': 0
        }
    logs = habit.logs.all()
    total_completed_days = 0
    for log in habit.logs.all():
        if log.value >= target_value:
            total_completed_days += 1
    return{
        'total_completed_days': total_completed_days
    } 
    


def get_longest_streak(habit):
    target_value = habit.target_value
    start_date = habit.start_date
    if not habit.is_active:
        return {
            'longest_streak':0
        }
    streak = 0
    longest_streak = 0

    log_by_date ={
        log.date :log
        for log in habit.logs.all()
    }
    today = timezone.localdate()
    current_day = start_date
    while current_day <= today:
        log = log_by_date.get(current_day)
        if not log:
            streak = 0
        elif log.value<target_value:
            streak = 0
        else:
            streak+=1
            longest_streak=max(streak, longest_streak)    
        current_day += timedelta(days=1)        
    return {
        "longest_streak": longest_streak,
    }     


def get_completion_rate(habit):

    today = timezone.localdate()
    completed_days = get_total_completed_days(habit)["total_completed_days"]

    if not habit.is_active:
        completion_rate = 0

    elif completed_days<= 0:
        completion_rate = 0 

    else:
        total_days = (today - habit.start_date).days + 1
        completion_rate = (completed_days * 100 / total_days)
    return{
        'completion_rate':completion_rate
    }
 
    
def get_last_7_days_status(habit):
    today = timezone.localdate()
    target_value = habit.target_value

    if not habit.is_active:
        return{
            'last_7_days_status':[]
        }
    
    log_by_date ={
        log.date:log
        for log in habit.logs.all()
    }
    last_7_days_status = []
    for i in range(6, -1, -1):
        current_day = today - timedelta(days=i)
        log = log_by_date.get(current_day)

        if not log:
            completed = False

        elif log.value < target_value:
            completed = False

        else:
            completed = True

        last_7_days_status.append({
            'date': str(current_day),
            'completed': completed
        })
    return{
        'last_7_days_status':last_7_days_status
    }   


def get_habit_stats(habit):
    return {
        **streaks.get_habit_streak_data(habit),
        **get_total_completed_days(habit),
        **get_longest_streak(habit),
        **get_completion_rate(habit),
        **get_last_7_days_status(habit),
    } 
    


