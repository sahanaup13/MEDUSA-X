from rest_framework import viewsets
from .models import ClinicalAlert
from rest_framework.serializers import ModelSerializer


class AlertSerializer(ModelSerializer):
    class Meta:
        model = ClinicalAlert
        fields = "__all__"


class AlertViewSet(viewsets.ModelViewSet):
    queryset = ClinicalAlert.objects.all().order_by("-created_at")
    serializer_class = AlertSerializer