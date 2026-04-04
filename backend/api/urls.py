from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DishViewSet, SaleViewSet, ExpenseViewSet, InventoryItemViewSet, SupplierOrderViewSet

router = DefaultRouter()
router.register(r'dishes', DishViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'supplier-orders', SupplierOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
