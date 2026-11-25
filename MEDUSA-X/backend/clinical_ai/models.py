from django.db import models
from patients.models import Patient


class ClinicalSummary(models.Model):
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE,
        related_name="clinical_summaries"
    )
    summary_text = models.TextField()
    evidence = models.JSONField(default=list)
    requires_review = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Summary - {self.patient.full_name}"