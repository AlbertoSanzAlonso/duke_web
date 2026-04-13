from rest_framework import serializers
from ..models import ActionLog

class ActionLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = ActionLog
        fields = ['id', 'user', 'username', 'module', 'action_type', 'description', 'timestamp']

    def get_username(self, obj):
        return obj.user.username if obj.user else "Sistema"
