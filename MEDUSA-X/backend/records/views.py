from .serializers import ClinicalDocumentSerializer
from .models import ClinicalDocument

from reconciliation.services import run_all_reconciliation
from audit.services import log_activity

from pypdf import PdfReader

from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response


MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024


def classify_document(text):
    text = text.lower()

    if any(word in text for word in [
        "emergency triage",
        "triage and intake",
        "triage record",
        "emergency patient",
    ]):
        return "ADMISSION"

    if any(word in text for word in [
        "discharge summary",
        "discharged",
        "discharge date",
    ]):
        return "DISCHARGE"

    if any(word in text for word in [
        "hemoglobin",
        "blood test",
        "laboratory",
        "hba1c",
        "glucose",
    ]):
        return "LAB"

    if any(word in text for word in [
        "prescription",
        "medication",
        "dosage",
        "tablet",
    ]):
        return "PRESCRIPTION"

    if any(word in text for word in [
        "admission",
        "admitted",
    ]):
        return "ADMISSION"

    if any(word in text for word in [
        "progress note",
        "follow-up",
        "clinical progress",
    ]):
        return "PROGRESS"

    return "OTHER"


class ClinicalDocumentViewSet(viewsets.ModelViewSet):

    queryset = (
        ClinicalDocument.objects.select_related("patient")
        .all()
        .order_by("-uploaded_at")
    )

    serializer_class = ClinicalDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):

        uploaded_file = self.request.FILES.get("file")

        if not uploaded_file:
            raise serializers.ValidationError(
                {"file": "Please upload a PDF file."}
            )

        if uploaded_file.size > MAX_FILE_SIZE_BYTES:
            raise serializers.ValidationError(
                {"file": "Maximum file size allowed is 15 MB."}
            )

        if not uploaded_file.name.lower().endswith(".pdf"):
            raise serializers.ValidationError(
                {"file": "Only PDF files are supported."}
            )

        document = serializer.save()

        try:
            with document.file.open("rb") as pdf_file:
                reader = PdfReader(pdf_file)

                extracted_pages = []

                for page_number, page in enumerate(
                    reader.pages, start=1
                ):
                    page_text = page.extract_text() or ""

                    extracted_pages.append(
                        f"[Page {page_number}]\n{page_text}"
                    )

            extracted_text = "\n\n".join(extracted_pages)

            document.extracted_text = extracted_text

            if extracted_text.strip():
                document.status = "EXTRACTED"
                document.document_type = classify_document(
                    extracted_text
                )
            else:
                document.status = "FAILED"

        except Exception as error:
            print("PDF EXTRACTION ERROR:", error)
            document.extracted_text = ""
            document.status = "FAILED"

        document.save(
            update_fields=[
                "extracted_text",
                "status",
                "document_type",
            ]
        )

        log_activity(
            "DOCUMENT_UPLOADED",
            f"Document '{document.title}' uploaded. "
            f"Extraction status: {document.status}.",
            document.patient,
            self.request
        )

        if document.status == "EXTRACTED":
            run_all_reconciliation(document.patient_id)

    @action(detail=True, methods=["get"])
    def extracted_text(self, request, pk=None):

        document = self.get_object()

        return Response({
            "document_id": document.id,
            "patient_id": document.patient_id,
            "title": document.title,
            "document_type": document.document_type,
            "status": document.status,
            "text": document.extracted_text,
            "uploaded_at": document.uploaded_at,
        })

    def perform_destroy(self, instance):

        patient_id = instance.patient_id
        patient = instance.patient
        title = instance.title
        file = instance.file

        log_activity(
            "DOCUMENT_DELETED",
            f"Document '{title}' deleted.",
            patient,
            self.request
        )

        instance.delete()

        if file:
            file.delete(save=False)

        run_all_reconciliation(patient_id)