from django.db import models


class Patient(models.Model):
    full_name = models.CharField(max_length=120)
    age = models.PositiveIntegerField()
    mrn = models.CharField(max_length=40, unique=True)
    sex = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=40, default="Pending Review")
    conflict_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.mrn})"