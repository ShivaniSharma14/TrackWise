from django.db import transaction


class DemoWorkspaceMutationMixin:
    def _lock_demo_workspace(self):
        user = self.request.user
        if user.is_demo:
            user.__class__.objects.select_for_update().get(pk=user.pk)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self._lock_demo_workspace()
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self._lock_demo_workspace()
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        self._lock_demo_workspace()
        return super().partial_update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        self._lock_demo_workspace()
        return super().destroy(request, *args, **kwargs)