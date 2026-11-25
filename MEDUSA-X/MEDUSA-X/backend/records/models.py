from django.db import models
from patients.models import Patient


class ClinicalDocument(models.Model):
    DOCUMENT_TYPES = [
        ("ADMISSION", "Admission Note"),
        ("LAB", "Laboratory Report"),
        ("PRESCRIPTION", "Prescription"),
        ("PROGRESS", "Progress Note"),
        ("DISCHARGE", "Discharge Summary"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("UPLOADED", "Uploaded"),
        ("EXTRACTED", "Text Extracted"),
        ("FAILED", "Extraction Failed"),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField(max_length=200)
    document_type = models.CharField(
        max_length=20, choices=DOCUMENT_TYPES, default="OTHER"
    )
    file = models.FileField(upload_to="clinical_documents/")
    extracted_text = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="UPLOADED"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title