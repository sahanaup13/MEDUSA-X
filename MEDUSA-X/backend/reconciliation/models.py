from django.db import models
from patients.models import Patient


class ReconciliationIssue(models.Model):
    ISSUE_TYPES = [
        ("DIAGNOSIS", "Diagnosis Conflict"),
        ("MEDICATION", "Medication Conflict"),
        ("MISSING", "Missing Information"),
        ("TIMELINE", "Timeline Conflict"),
        ("OTHER", "Other"),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE,
        related_name="reconciliation_issues"
    )
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPES)
    description = models.TextField()
    evidence = models.TextField(blank=True)
    reviewer_note = models.TextField(blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.full_name} - {self.issue_type}"