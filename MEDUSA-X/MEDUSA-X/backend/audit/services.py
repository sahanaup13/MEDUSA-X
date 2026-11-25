from .models import AuditEvent


def log_activity(action, description="", patient=None, request=None):
    try:
        user = None

        if request and request.user.is_authenticated:
            user = request.user

        return AuditEvent.objects.create(
            user=user,
            patient=patient,
            action=action,
            description=description
        )

    except Exception as error:
        print("AUDIT LOG ERROR:", error)
        return None