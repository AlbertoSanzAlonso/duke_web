from django.db import models
from django.contrib.auth.models import User

class ActionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='action_logs')
    module = models.CharField(max_length=50) 
    action_type = models.CharField(max_length=50)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.username if self.user else "Sistema"
        return f"[{self.timestamp.strftime('%d/%m/%Y %H:%M')}] {user_str} - {self.module}: {self.action_type}"

def log_action(user, module, action_type, description):
    """Auxiliar para registrar acciones administrativas."""
    try:
        from django.contrib.auth.models import User
        target_user = user
        if isinstance(user, (int, str)) and not isinstance(user, User):
            target_user = User.objects.get(id=user)
        
        ActionLog.objects.create(
            user=target_user if isinstance(target_user, User) else None,
            module=module,
            action_type=action_type,
            description=description
        )
    except Exception as e:
        print(f"Error logging action: {e}")
