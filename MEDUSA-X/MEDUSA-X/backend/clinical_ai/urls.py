from django.urls import path
from .views import PatientTimelineView, DraftSummaryView

urlpatterns = [
    path(
        "patients/<int:patient_id>/timeline/",
        PatientTimelineView.as_view()
    ),
    path(
        "patients/<int:patient_id>/draft-summary/",
        DraftSummaryView.as_view()
    ),
]