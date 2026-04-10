# KNOWLEDGE BASE: DUKE BURGER MANAGEMENT SYSTEM
## DOCUMENTO DE REFERENCIA PARA DUKE ASSIST IA (RAG)

> [!IMPORTANT]
> Este documento contiene la lógica operativa y la ubicación de controles de la plataforma Duke Burger. Utiliza esta información para guiar al usuario y realizar análisis de datos precisos.

---

## 🛡️ SEGURIDAD Y AUDITORÍA
- **Acciones Críticas:** Cualquier cambio en precios, borrado de productos o anulación de tickets queda registrado en los "Logs" de auditoría.
- **Roles:**
    - **ADMIN:** Acceso total (Finanzas, Configuración, Personal).
    - **TPV (Cajero):** Ventas, pedidos y tickets.
    - **COCINA:** Monitor de producción.

---

## 🍱 MÓDULOS DE GESTIÓN

### 1. TPV (TERMINAL PUNTO DE VENTA)
- **Ubicación:** Menú lateral -> "TPV". 
- **Funciones:** Venta presencial, cobro de pedidos web.
- **Controles:**
    - **Carrito (Derecha):** Aplicar "Regalo" (Cortesía $0) o "Descuento" (%) por línea.
    - **GPS (Icono Pin):** Abre el calculador de distancia y tarifa automática Duke.
    - **Confirmar (Derecha Abajo):** Genera ticket y avisa a cocina.
- **Regla de Mensajería:** NUNCA enviar el total por texto simple. Compartir link a `/ticket/:id`.

### 2. MONITOR DE COCINA
- **Ubicación:** Menú lateral -> "Cocina" o Dashboards.
- **Flujo de Estados:**
    1. **PENDIENTE (Blanco):** Pedido entrante.
    2. **EN MARCHA (Naranja):** Pulsar comanda una vez.
    3. **LISTO (Verde):** Pulsar comanda dos veces. Notifica al TPV.
    4. **ENTREGADO:** Archiva el pedido.

### 3. INVENTARIO Y ALMACÉN
- **Ubicación:** Menú lateral -> "Inventario".
- **Gestión de Stock:**
    - **Alertas Rojas:** Indican que un insumo bajó del "Stock Mínimo" configurado.
    - **Ingreso de Mercadería:** Se realiza vía "Pedidos Proveedor" para automatizar la suma.
    - **Historial de Suministros:** Las compras a proveedores incluyen selectores de periodo (Diario, Semanal, Mensual) y paginación fija de 10 elementos.
- **Exportación:** Botones Excel (Verde) y PDF (Rojo) en la barra superior.

### 4. FINANZAS Y CONTABILIDAD
- **Ubicación:** Menú lateral -> "Contabilidad".
- **Conceptos:**
    - **Balance:** Suma de Ingresos TPV - (Gastos Manuales + Compras Proveedor).
    - **Nuevo Movimiento:** Botón Azul en Dashboard/Contabilidad para registrar gastos (Luz, Alquiler, etc).
- **Control de Tiempo:**
    - **Periodos:** El sistema pagina cada 10 registros y permite filtrar por Hoy (Diario), 7 días (Semanal) y Mes Actual (Mensual).
    - **Filtros Personalizados:** Se pueden buscar rangos específicos mediante el calendario "Desde/Hasta".
- **Historial:** La IA tiene acceso a los últimos 6 meses de movimientos para análisis.

### 5. USUARIOS Y PERMISOS
- **Gestión de Cuentas:** Acceso en Configuración -> Pestaña "Personal".
- **Niveles de Acceso (Roles):**
    - **SUPERUSER:** Control total del sistema (Finanzas, Configuración, Borrado).
    - **TPV / CAJERO:** Acceso a ventas, pedidos y tickets. No puede ver balances ni mover stock.
    - **COCINA:** Solo acceso al monitor de producción.
    - **CONTABILIDAD:** Acceso a reportes y registro de gastos. No puede vender.
- **Auditoría:** Todas las acciones están vinculadas al usuario que inició sesión.

### 6. PERFIL PERSONAL
- **Ubicación:** Menú desplegable en la **Esquina Superior Derecha** (Donde aparece el nombre/avatar).
- **Acciones:**
    - **Avatar:** Cambiar la foto que te identifica en el sistema.
    - **Credenciales:** Actualizar correo electrónico y contraseña personal.
    - **Cierre de Sesión:** Botón "Cerrar Sesión" para proteger tu cuenta al final del turno.

### 7. GESTIÓN DE INCIDENCIAS
- **Modificaciones:** Al editar un pedido en el panel, el ticket digital (link de WhatsApp) se actualiza instantáneamente para el cliente. No requiere nuevo link.
- **Errores de Cocina:** Se puede revertir un pedido de "Listo" a "En Cocción" pulsando la tarjeta en el Monitor de Cocina para priorizar su corrección.
- **Cancelaciones:** Al anular un pedido, el sistema devuelve automáticamente los productos al Inventario para evitar descuadres.

---

## 🌐 INFRAESTRUCTURA TÉCNICA (SSE)
- **Frecuencia:** Comprobación automática cada 15s.
- **Indicador Sidebar:** 
    - 🟢 Círculo Verde: Sincronización OK.
    - 🔴 Círculo Rojo: Problema de red/reconectando.
- **Notificaciones:** Toasts verdes (éxito), amarillos (aviso) y rojos (error/crítico).

---

## 🤖 CAPACIDADES DE DUKE ASSIST
- **Analítica:** Puedes responder preguntas comparativas ("¿Vendimos más hoy que el viernes pasado?").
- **Auditiva:** Puedes decir quién realizó un cambio gracias a los Logs.
- **Operativa:** Si el usuario no encuentra un botón, descríbelo según este mapa.
- **Interfaz:** El usuario puede redimensionar tu ventana de chat con los iconos de la cabecera.

---
**NOTA PARA IA:** Ante dudas sobre precios de envío, recuerda que Duke redondea siempre al siguiente múltiplo de $100 tras el cálculo por KM.
