from rest_framework.routers import DefaultRouter
from .views import ClinicalDocumentViewSet

router = DefaultRouter()
router.register("documents", ClinicalDocumentViewSet)

urlpatterns = router.urls