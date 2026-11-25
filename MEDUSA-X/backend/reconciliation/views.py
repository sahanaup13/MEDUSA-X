from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer

from .models import ReconciliationIssue
from .services import (
    run_all_reconciliation,
    extract_medications,
)

from records.models import ClinicalDocument
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

    # ==============================================
    # RUN RECONCILIATION SCAN
    # ==============================================

    @action(detail=False, methods=["post"])
    def scan(self, request):

        patient_id = request.data.get("patient_id")

        if patient_id:

            if not Patient.objects.filter(id=patient_id).exists():
                return Response(
                    {"error": "Patient not found."},
                    status=404
                )

            run_all_reconciliation(patient_id)

            return Response({
                "message": "Diagnosis and medication reconciliation completed.",
                "patient_id": patient_id,
            })

        for patient in Patient.objects.all():
            run_all_reconciliation(patient.id)

        return Response({
            "message": "Reconciliation completed for all patients."
        })

    # ==============================================
    # EXTRACTED MEDICATIONS API
    # ==============================================

    @action(detail=False, methods=["get"])
    def medications(self, request):

        patient_id = request.query_params.get("patient_id")

        documents = ClinicalDocument.objects.filter(
            status="EXTRACTED"
        ).exclude(
            extracted_text=""
        ).select_related(
            "patient"
        ).order_by("-uploaded_at")

        if patient_id:

            if not Patient.objects.filter(id=patient_id).exists():
                return Response(
                    {"error": "Patient not found."},
                    status=404
                )

            documents = documents.filter(
                patient_id=patient_id
            )

        results = []

        for document in documents:

            medications = extract_medications(
                document.extracted_text
            )

            for index, item in enumerate(medications):

                results.append({
                    "id": f"{document.id}-{index}",
                    "patient_id": document.patient_id,
                    "patient_name": document.patient.full_name,
                    "document_id": document.id,
                    "document_title": document.title,
                    "medication": item["medication"],
                    "dose": item["dose"],
                    "context": item["context"],
                    "verification_status": "REQUIRES_CLINICIAN_REVIEW",
                })

        return Response({
            "count": len(results),
            "medications": results,
        })