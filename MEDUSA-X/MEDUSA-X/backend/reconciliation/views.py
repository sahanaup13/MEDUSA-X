from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer

from .models import ReconciliationIssue
from .services import run_diagnosis_reconciliation

from patients.models import Patient


class ReconciliationSerializer(ModelSerializer):

    class Meta:
        model = ReconciliationIssue
        fields = "__all__"


class ReconciliationViewSet(viewsets.ModelViewSet):

    queryset = (
        ReconciliationIssue.objects
        .select_related("patient")
        .all()
        .order_by("-created_at")
    )

    serializer_class = ReconciliationSerializer

    @action(detail=False, methods=["post"])
    def scan(self, request):

        patient_id = request.data.get("patient_id")

        if patient_id:

            if not Patient.objects.filter(id=patient_id).exists():
                return Response(
                    {"error": "Patient not found."},
                    status=404
                )

            run_diagnosis_reconciliation(patient_id)

            return Response({
                "message": "Patient reconciliation scan completed.",
                "patient_id": patient_id,
            })

        for patient in Patient.objects.all():
            run_diagnosis_reconciliation(patient.id)

        return Response({
            "message": "Reconciliation scan completed for all patients."
        })