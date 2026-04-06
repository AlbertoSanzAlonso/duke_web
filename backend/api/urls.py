from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, MenuEntryViewSet, SaleViewSet, ExpenseViewSet, InventoryItemViewSet, SupplierOrderViewSet, OrderStreamView, GlobalSettingViewSet, GalleryImageViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'menu-entries', MenuEntryViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'supplier-orders', SupplierOrderViewSet)
router.register(r'settings', GlobalSettingViewSet)
router.register(r'gallery', GalleryImageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('orders-stream/', OrderStreamView, name='order_stream'),
]
