from django.contrib.auth.models import User
from rest_framework import serializers, generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]


class CurrentUserView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"authenticated": False})

        return Response({
            "authenticated": True,
            "username": request.user.username,
            "email": request.user.email,
        })