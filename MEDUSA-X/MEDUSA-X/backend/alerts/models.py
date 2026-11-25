from django.db import models
from patients.models import Patient


class ClinicalAlert(models.Model):
    SEVERITIES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("CRITICAL", "Critical"),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE,
        related_name="alerts", null=True, blank=True
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(
        max_length=20, choices=SEVERITIES, default="MEDIUM"
    )
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title