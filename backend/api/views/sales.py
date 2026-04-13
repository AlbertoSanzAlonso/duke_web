import json
import time
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.http import StreamingHttpResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from ..models import Sale, log_action, deduct_inventory_for_sale
from ..serializers import SaleSerializer, SaleCreateSerializer
from ..permissions import HasTPVPermission

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items', 'items__menu_entry', 'items__menu_entry__product').all().order_by('-date')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SaleCreateSerializer
        return SaleSerializer

    def get_permissions(self):
        if self.action in ['create', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action in ['mark_prepared', 'mark_delivered', 'revert_prepared', 'revert_delivery']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), HasTPVPermission()]

    @action(detail=False, methods=['post'], url_path='bulk-actions')
    def bulk_actions(self, request):
        ids = request.data.get('ids', [])
        action_type = request.data.get('action')
        if not ids:
            return Response({'error': 'No se seleccionaron tickets'}, status=400)
            
        sales = Sale.objects.filter(id__in=ids, status='PENDING')
        if action_type == 'COMPLETE':
            sales_to_complete = list(sales.prefetch_related('items__menu_entry__product__ingredients_list__inventory_item'))
            count = sales.update(status='COMPLETED')
            for s in sales_to_complete:
                s.status = 'COMPLETED'
                deduct_inventory_for_sale(s)
            log_action(request.user, 'TPV', 'UPDATE', f'Cobro masivo de {count} tickets')
            return Response({'message': f'{count} tickets cobrados.'})
        elif action_type == 'DELETE':
            count, _ = sales.delete()
            log_action(request.user, 'TPV', 'DELETE', f'Eliminación masiva de {count} tickets')
            return Response({'message': f'{count} tickets eliminados.'})
        return Response({'error': 'Operación no válida'}, status=400)
        
    @action(detail=True, methods=['post'], url_path='mark-prepared')
    def mark_prepared(self, request, pk=None):
        sale = self.get_object()
        sale.is_prepared = True
        sale.prepared_at = timezone.now()
        sale.save()
        log_action(request.user if request.user.is_authenticated else None, 'COCINA', 'UPDATE', f'Pedido #{sale.id} PREPARADO')
        return Response({'message': 'Pedido preparado.'})

    @action(detail=True, methods=['post'], url_path='mark-delivered')
    def mark_delivered(self, request, pk=None):
        sale = self.get_object()
        sale.is_delivered = True
        sale.delivered_at = timezone.now()
        sale.save()
        log_action(request.user if request.user.is_authenticated else None, 'COCINA', 'UPDATE', f'Pedido #{sale.id} ENTREGADO')
        return Response({'message': 'Pedido entregado.'})

    # Revert actions omitted for brevity in summary but should be included
    @action(detail=True, methods=['post'], url_path='revert-delivery')
    def revert_delivery(self, request, pk=None):
        sale = self.get_object()
        sale.is_delivered = False
        sale.delivered_at = None
        sale.save()
        return Response({'message': 'Entrega revertida.'})

    @action(detail=True, methods=['post'], url_path='revert-prepared')
    def revert_prepared(self, request, pk=None):
        sale = self.get_object()
        sale.is_prepared = False
        sale.is_delivered = False
        sale.prepared_at = None
        sale.delivered_at = None
        sale.save()
        return Response({'message': 'Preparación revertida.'})

@csrf_exempt
def OrderStreamView(request):
    """SSE para notificaciones en tiempo real."""
    origin = request.headers.get('Origin') or 'https://dukeburger-sj.com'
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response

    from rest_framework.authtoken.models import Token
    token_key = request.GET.get('token')
    if not token_key or not Token.objects.filter(key=token_key.strip()).exists():
        return HttpResponse(status=401)

    def event_stream():
        yield f"data: {json.dumps({'type': 'connection_ready'})}\n\n"
        last_seen_id = (Sale.objects.order_by('-id').first().id if Sale.objects.exists() else 0)
        last_check_time = timezone.now()
        while True:
            current_time = timezone.now()
            for sale in Sale.objects.filter(id__gt=last_seen_id).order_by('id'):
                yield f"data: {json.dumps({'type': 'new_order', 'id': sale.id, 'customer': sale.customer_name})}\n\n"
                last_seen_id = sale.id
            for sale in Sale.objects.filter(updated_at__gt=last_check_time, id__lte=last_seen_id):
                yield f"data: {json.dumps({'type': 'order_updated', 'id': sale.id, 'status': sale.status})}\n\n"
            last_check_time = current_time
            yield ": ping\n\n"
            time.sleep(15)

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['X-Accel-Buffering'] = 'no'
    response['Cache-Control'] = 'no-cache'
    response['Access-Control-Allow-Origin'] = origin
    response['Access-Control-Allow-Credentials'] = 'true'
    return response
