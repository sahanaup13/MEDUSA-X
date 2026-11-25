from rest_framework import serializers
from .models import ClinicalDocument


class ClinicalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalDocument
        fields = "__all__"
        read_only_fields = ["extracted_text", "status", "uploaded_at"]