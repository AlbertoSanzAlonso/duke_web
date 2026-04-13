from rest_framework import viewsets, permissions
from ..models import Expense, log_action
from ..serializers import ExpenseSerializer
from ..permissions import HasAccountingPermission

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, HasAccountingPermission]

    def perform_create(self, serializer):
        expense = serializer.save()
        log_action(self.request.user, 'CONTABILIDAD', 'CREATE', f'Nuevo gasto: {expense.description} por ${expense.amount}')

    def perform_destroy(self, instance):
        log_action(self.request.user, 'CONTABILIDAD', 'DELETE', f'Eliminado gasto: {instance.description}')
        instance.delete()
