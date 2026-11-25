from rest_framework import viewsets

from .models import Patient
from .serializers import PatientSerializer
from audit.services import log_activity


class PatientViewSet(viewsets.ModelViewSet):

    queryset = Patient.objects.all().order_by("-updated_at")
    serializer_class = PatientSerializer

    def perform_create(self, serializer):
        patient = serializer.save()

        log_activity(
            "PATIENT_REGISTERED",
            f"Patient {patient.full_name} registered.",
            patient,
            self.request
        )

    def perform_update(self, serializer):
        patient = serializer.save()

        log_activity(
            "PATIENT_UPDATED",
            f"Patient record updated: {patient.full_name}.",
            patient,
            self.request
        )

    def perform_destroy(self, instance):
        patient_name = instance.full_name
        patient_id = instance.id

        log_activity(
            "PATIENT_DELETED",
            f"Patient {patient_name} (ID: {patient_id}) deleted.",
            request=self.request
        )

        instance.delete()