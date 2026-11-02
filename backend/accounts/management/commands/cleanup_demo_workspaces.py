from django.core.management.base import BaseCommand

from accounts.demo_workspace import cleanup_expired_demo_workspaces


class Command(BaseCommand):
    help = "Delete expired per-visitor demo workspaces and their sample data."

    def handle(self, *args, **options):
        deleted = cleanup_expired_demo_workspaces()
        self.stdout.write(
            self.style.SUCCESS(f"Removed {deleted} expired demo workspace(s).")
        )