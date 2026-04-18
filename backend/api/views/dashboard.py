import os
import json
import urllib.request
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, F, Count
from django.db.models.functions import TruncDate, TruncMonth
from datetime import timedelta
from django.conf import settings

from ..models import Sale, Expense, InventoryItem, MenuEntry, Product, ActionLog, InventoryMovement, InventoryDailyConsumption, SupplierOrder, SaleItem
from ..serializers import UserSerializer, InventoryItemSerializer, OpeningHourSerializer
from ..models import OpeningHour

@api_view(['GET'])
@permission_classes([AllowAny])
def HealthCheckView(request):
    """Internal health check endpoint."""
    return Response({"status": "healthy", "timestamp": timezone.now()}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def DashboardInsightsView(request):
    """
    Unified performance endpoint to reduce Dashboard roundtrips.
    """
    from ..mail_utils import get_unread_mail_count
    now = timezone.localtime()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Profile
    user_data = UserSerializer(request.user).data
    
    # Sales (Optimized)
    # Today's stats use today_start
    today_sales_qs = Sale.objects.filter(date__gte=today_start)
    today_sales_count = today_sales_qs.count()
    
    # Pendientes: Include ALL pending orders regardless of date so pre-orders are seen
    all_pending_qs = Sale.objects.filter(status='PENDING')
    pending_total_count = all_pending_qs.count()
    
    completed_today = today_sales_qs.filter(status='COMPLETED').count()
    
    # Kitchen stats: Based on all pending/active orders
    active_sales_qs = Sale.objects.filter(status='PENDING')
    kitchen_pending = active_sales_qs.filter(is_prepared=False).count()
    kitchen_ready = active_sales_qs.filter(is_prepared=True, is_delivered=False).count()
    
    # Monthly Stats
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_sales = Sale.objects.filter(date__gte=month_start, status='COMPLETED').aggregate(total=Sum('total_amount'))['total'] or 0
    monthly_expenses = Expense.objects.filter(date__gte=month_start).aggregate(total=Sum('amount'))['total'] or 0
    
    # Inventory
    low_stock = InventoryItemSerializer(
        InventoryItem.objects.filter(quantity__lte=F('min_stock')), 
        many=True
    ).data
    
    # Kitchen detail lists
    # Pending and Ready come from active_sales_qs (all pending regardless of date)
    kitchen_pending_list = active_sales_qs.filter(is_prepared=False).values('id', 'customer_name', 'date', 'total_amount')
    kitchen_ready_list = active_sales_qs.filter(is_prepared=True, is_delivered=False).values('id', 'customer_name', 'updated_at', 'total_amount')
    
    # Delivered comes from today_sales_qs (only today's delivered activity)
    kitchen_delivered_list = today_sales_qs.filter(is_delivered=True).values('id', 'customer_name', 'updated_at', 'total_amount')
    kitchen_delivered_count = today_sales_qs.filter(is_delivered=True).count()

    def to_float(val):
        try:
            return float(val) if val is not None else 0.0
        except:
            return 0.0

    # Rename customer_name to customer for frontend compatibility
    pending_list = [{'id': x['id'], 'customer': x['customer_name'] or 'Cliente', 'created_at': x['date'], 'total': to_float(x['total_amount'])} for x in kitchen_pending_list]
    ready_list = [{'id': x['id'], 'customer': x['customer_name'] or 'Cliente', 'updated_at': x['updated_at'], 'total': to_float(x['total_amount'])} for x in kitchen_ready_list]
    delivered_list = [{'id': x['id'], 'customer': x['customer_name'] or 'Cliente', 'updated_at': x['updated_at'], 'total': to_float(x['total_amount'])} for x in kitchen_delivered_list]

    # Fetch mail settings from GlobalSettings
    from ..models import GlobalSetting
    imap_server = GlobalSetting.objects.filter(key='imap_server').first()
    imap_user = GlobalSetting.objects.filter(key='imap_user').first()
    imap_password = GlobalSetting.objects.filter(key='imap_password').first()
    
    unread_count = 0
    if imap_server and imap_user and imap_password:
        try:
            unread_count = get_unread_mail_count(
                imap_server.value, 
                imap_user.value, 
                imap_password.value
            )
        except:
            unread_count = -1
    else:
        unread_count = -1 # Mail not configured

    # Current day hours
    today_hour_obj = OpeningHour.objects.filter(day=now.isoweekday()).first()
    today_hours_data = OpeningHourSerializer(today_hour_obj).data if today_hour_obj else None

    # Stats safety
    safe_sales = to_float(monthly_sales)
    safe_expenses = to_float(monthly_expenses)

    # Fetch last 10 logs
    recent_logs = ActionLog.objects.select_related('user').all().order_by('-timestamp')[:10]
    logs_data = []
    for log in recent_logs:
        logs_data.append({
            'id': log.id,
            'user': log.user.username if log.user else 'Sistema',
            'module': log.module,
            'action': log.action_type,
            'description': log.description,
            'timestamp': log.timestamp
        })

    return Response({
        'profile': user_data,
        'today_sales': {
            'total_count': today_sales_count,
            'pending': pending_total_count,
            'completed': completed_today,
            'kitchen_pending': kitchen_pending,
            'kitchen_ready': kitchen_ready,
            'kitchen_delivered': kitchen_delivered_count,
            'kitchen_pending_list': pending_list,
            'kitchen_ready_list': ready_list,
            'kitchen_delivered_list': delivered_list
        },
        'active_promos': MenuEntry.objects.filter(is_available=True).count(),
        'today_hours': today_hours_data,
        'unread_mail': unread_count,
        'monthly_stats': {
            'total_sales': safe_sales,
            'total_expenses': safe_expenses,
            'net': safe_sales - safe_expenses
        },
        'low_stock': low_stock,
        'recent_history': logs_data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def AIHelpView(request):
    """
    Duke Assist: IA contextualizada con manual y estado real de la base de datos.
    """
    question = request.data.get('question')
    if not question:
        return Response({'error': 'Pregunta requerida'}, status=400)
    
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return Response({'answer': 'Asistente de IA no configurado (falta GROQ_API_KEY).'})

    # 1. Manual Context
    manual_content = ""
    try:
        manual_path = os.path.join(settings.BASE_DIR, '..', 'docs', 'manual_admin.md')
        if os.path.exists(manual_path):
            with open(manual_path, 'r', encoding='utf-8') as f:
                manual_content = f.read()
    except: pass

    # 2. Dynamic Live Context
    try:
        now = timezone.localtime()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Financials
        sales_today = Sale.objects.filter(date__gte=today_start, status='COMPLETED')
        total_sales = sales_today.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Inventory summary
        all_inventory = InventoryItem.objects.all().order_by('name')
        inventory_summary = "\n".join([f"- {i.name}: {i.quantity} {i.unit}" for i in all_inventory])
        
        # Critical stock
        critical_items = InventoryItem.objects.filter(quantity__lte=F('min_stock'))
        stock_critical_info = ", ".join([i.name for i in critical_items]) if critical_items.exists() else "Todo OK"

        live_context = (
            f"ESTADO DEL SISTEMA ({now.strftime('%d/%m/%y %H:%M')}):\n"
            f"- Ventas Hoy: ${total_sales}\n"
            f"- Stock Crítico: {stock_critical_info}\n\n"
            f"--- STOCK COMPLETO ---\n{inventory_summary}"
        )
    except Exception as e:
        live_context = f"Error context: {str(e)}"

    # 3. AI Interaction
    system_instruction = (
        "Eres el asistente virtual oficial de Duke Burger. "
        f"\n\n--- MANUAL ---\n{manual_content}\n"
        f"\n\n--- ESTADO LIVE ---\n{live_context}\n"
        "Reglas: Responde en Markdown, sé profesional y usa datos reales."
    )

    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": question}
        ],
        "temperature": 0.4
    }

    try:
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
        )
        with urllib.request.urlopen(req, timeout=30) as res:
            res_data = json.loads(res.read().decode('utf-8'))
            return Response({'answer': res_data['choices'][0]['message']['content']})
    except urllib.error.HTTPError as he:
        err_body = he.read().decode('utf-8')
        return Response({'error': f'Groq API Error ({he.code}): {err_body}'}, status=502)
    except Exception as e:
        return Response({'error': f'AI Assistant error: {str(e)}'}, status=502)
