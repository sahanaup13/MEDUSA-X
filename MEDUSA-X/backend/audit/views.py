from rest_framework import viewsets
from rest_framework.serializers import ModelSerializer
from .models import AuditEvent


class AuditSerializer(ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = "__all__"
        read_only_fields = ["created_at"]


class AuditViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditEvent.objects.all().order_by("-created_at")
    serializer_class = AuditSerializer