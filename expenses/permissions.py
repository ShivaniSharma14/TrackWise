from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'habit'):
            return obj.habit.user==request.user
        return False
         
         