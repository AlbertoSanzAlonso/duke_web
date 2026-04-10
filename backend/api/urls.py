from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ProductViewSet, MenuEntryViewSet, SaleViewSet, ExpenseViewSet, 
                    InventoryItemViewSet, SupplierOrderViewSet, OrderStreamView, 
                    GlobalSettingViewSet, GalleryImageViewSet, OpeningHourViewSet, 
                    DeliverySettingViewSet, AdminSetupView, 
                    PasswordResetRequestView, PasswordResetConfirmView, MeView, UserViewSet,
                    ActionLogViewSet, AIHelpView, MailCheckView, MailTestView, DashboardInsightsView, HealthCheckView)
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'menu-entries', MenuEntryViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'expenses', ExpenseViewSet)
router.register(r'supplier-orders', SupplierOrderViewSet)
router.register(r'settings', GlobalSettingViewSet)
router.register(r'opening-hours', OpeningHourViewSet)
router.register(r'delivery-rates', DeliverySettingViewSet)
router.register(r'gallery', GalleryImageViewSet, basename='gallery')
router.register(r'users', UserViewSet, basename='user')
router.register(r'action-logs', ActionLogViewSet, basename='action-log')

urlpatterns = [
    path('', include(router.urls)),
    path('orders-stream/', OrderStreamView, name='order_stream'),
    path('login/', obtain_auth_token, name='api_token_auth'),
    path('setup-admin-super/', AdminSetupView, name='admin_setup'),
    path('password-reset/', PasswordResetRequestView, name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView, name='password_reset_confirm'),
    path('me/', MeView, name='me'),
    path('ai-help/', AIHelpView, name='ai_help'),
    path('mail-check/', MailCheckView, name='mail_check'),
    path('mail-test/', MailTestView, name='mail_test'),
    path('dashboard-insights/', DashboardInsightsView, name='dashboard_insights'),
    path('health/', HealthCheckView, name='health_check'),
]
