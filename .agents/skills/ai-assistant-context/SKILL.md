# Duke Assist (IA) - Gestión del Conocimiento y Operativa

Habilidad especializada para el mantenimiento del asistente inteligente de Duke Burger.

## 🤖 Especificaciones Técnicas
- **Modelo:** `llama-3.3-70b-versatile` vía Groq API.
- **Endpoint:** `/api/ai-help/` (POST).
- **Frontend:** `AIChat.jsx` movido a la **esquina inferior izquierda** (`left: 25px`).
- **Autenticación (Fix 401):** El frontend DEBE usar `sessionStorage.getItem('duke_admin_token')`. El nombre anterior (`token`) causaba errores 401.

## 🧭 Jerarquía Visual (Z-Index)
- **Capa 2500:** Botón de Perfil (`UserDropdown`). (Bajado para no tapar modales).
- **Capa 5000:** Burbuja y ventana de Chat en escritorio.
- **Capa 10000:** Ventana de Chat en Móvil (Cubre todo).

## 🧠 Fuentes de Conocimiento (RAG)
1. **Manual Estático:** `docs/manual_admin.md` (Reglas de negocio, Delivery, Procedimientos).
2. **Contexto Vivo (Django ORM):** 
   - Stock Crítico (`InventoryItem.objects.filter(quantity__lte=F('min_stock'))`).
   - Pedidos Pendientes (`Sale.objects.filter(status='PENDING')`).
   - Categorías de Menú Activas.

## ⚠️ ESTADO ACTUAL (¡Urgente!)
Actualmente el backend está configurado en **`AllowAny`** como parche de emergencia debido a que el cliente superó el límite de despliegues en Vercel. 

### Tarea de Reversión:
**CUANDO VERCEL DESPLIEGUE EL COMMIT `8c5020c`**, se DEBE volver a cambiar en `backend/api/views.py`:
- De: `@permission_classes([permissions.AllowAny])`
- A: `@permission_classes([permissions.IsAuthenticated])`

## 🛠️ Reglas de Mantenimiento
- **Actualización Obligatoria:** Cada vez que cambie una regla de delivery o un flujo contable, se DEBE actualizar `docs/manual_admin.md`.
- **Validación:** Si el asistente no responde, verificar `GROQ_API_KEY` en el panel de Coolify.
