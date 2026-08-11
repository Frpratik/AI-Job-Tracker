from django.db import transaction

from .models import Application, ApplicationStatusHistory


@transaction.atomic
def record_initial_status(application: Application) -> None:
    ApplicationStatusHistory.objects.create(application=application, to_status=application.status)


@transaction.atomic
def transition_status(application: Application, new_status: str) -> Application:
    locked = Application.objects.select_for_update().get(pk=application.pk, user=application.user)
    if locked.status == new_status:
        return locked
    previous = locked.status
    locked.status = new_status
    locked.save(update_fields=("status", "updated_at"))
    ApplicationStatusHistory.objects.create(
        application=locked,
        from_status=previous,
        to_status=new_status,
    )
    return locked
