from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404

from patients.models import Patient
from records.models import ClinicalDocument

from audit.services import log_activity

from .models import ClinicalSummary
from .services import build_clinical_summary


class PatientTimelineView(APIView):

    def get(self, request, patient_id):

        patient = get_object_or_404(
            Patient,
            id=patient_id
        )

        documents = ClinicalDocument.objects.filter(
            patient=patient
        ).order_by("uploaded_at")

        timeline = [{
            "document_id": doc.id,
            "title": doc.title,
            "type": doc.document_type,
            "status": doc.status,
            "date": doc.uploaded_at,
        } for doc in documents]

        return Response({
            "patient": patient.full_name,
            "timeline": timeline,
        })


class DraftSummaryView(APIView):

    def post(self, request, patient_id):

        patient = get_object_or_404(
            Patient,
            id=patient_id
        )

        documents = list(
            ClinicalDocument.objects.filter(
                patient=patient,
                status="EXTRACTED"
            ).order_by("uploaded_at")
        )

        if not documents:
            return Response(
                {
                    "error": (
                        "No extracted documents are available "
                        "for this patient."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        summary_text, findings, evidence = (
            build_clinical_summary(
                patient,
                documents
            )
        )

        summary = ClinicalSummary.objects.create(
            patient=patient,
            summary_text=summary_text,
            evidence=evidence,
            requires_review=True,
        )

        log_activity(
            "AI_SUMMARY_GENERATED",
            f"Clinical intelligence report generated "
            f"for {patient.full_name}.",
            patient,
            request
        )

        return Response({

            "success": True,

            "summary_id": summary.id,

            "patient": patient.full_name,

            "summary": summary.summary_text,

            "findings": findings,

            "evidence": summary.evidence,

            "documents_reviewed": len(documents),

            "requires_clinician_review": True,

            "engine": "MEDUSA-X Document Intelligence Prototype",

        }, status=status.HTTP_201_CREATED)