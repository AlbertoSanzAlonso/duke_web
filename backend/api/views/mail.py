from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from ..models import GlobalSetting

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def MailTestView(request):
    from ..mail_utils import get_unread_mail_count
    server = request.data.get('server')
    user = request.data.get('user')
    password = request.data.get('password')
    
    count = get_unread_mail_count(server, user, password)
    if count == -1: return Response({'success': False}, status=400)
    return Response({'success': True, 'unread_count': count})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def MailCheckView(request):
    from ..mail_utils import get_unread_mail_count
    # Logic to get final_host, final_user, final_pass from settings/DB
    final_host = getattr(settings, 'IMAP_SERVER', None)
    # ... (rest of logic like in views.py)
    return Response({'unread_count': 0})
