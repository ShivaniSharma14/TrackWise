from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HabitViewSet, HabitLogViewSet, HabitStreakAPIView 

router = DefaultRouter()
router.register(r'logs', HabitLogViewSet, basename ='habit-log')
router.register(r'', HabitViewSet, basename = 'habit')


urlpatterns = [
    path('', include(router.urls)),
    path('<id>/streak/',HabitStreakAPIView.as_view(), name = 'habit-streak')
]    
