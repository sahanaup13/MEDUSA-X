from rest_framework.routers import DefaultRouter
from .views import ReconciliationViewSet

router = DefaultRouter()
router.register("reconciliation", ReconciliationViewSet)

urlpatterns = router.urls