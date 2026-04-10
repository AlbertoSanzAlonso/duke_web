# MANUAL DE USUARIO - DUKE BURGER ADMIN

¡Bienvenido al cerebro de Duke- **Heartbeat**: Envío obligatorio de `: ping` y heartbeats JSON cada 15s o menos para evitar timeouts de proxies.
- **Sync Workers**: En servidores Gunicorn `gthread`, se prefiere la vista SSE síncrona (`def` en lugar de `async def`) para evitar deadlocks con el ORM de Django, manejando la concurrencia mediante hilos del worker.
- **Polling Interval**: El backend debe realizar un `time.sleep(15)` entre comprobaciones de base de datos para equilibrar la inmediatez y el consumo de recursos de Supabase.
- **Frontend Lazy Loading**: Toda la navegación del frontend DEBE implementarse con `React.lazy` y `Suspense` utilizando el componente `<LoadingScreen />` de la marca como fallback.

## 4. Acciones Masivas y TPV
- **Floating Buttons (Móvil)**: Todos los botones flotantes (FAB) como el del TPV o el Duke Assist deben estar alineados a **20px** del borde inferior en versiones móviles para mantener la simetría visual.
- **Git Mandatory:** Para cualquier cambio en producción (Coolify), DEBES realizar un `push` a la rama `main` de GitHub. Coolify ignora los archivos locales que no se han empujado al repositorio.

## 1. TPV (Terminal Punto de Venta)
Es la herramienta para cobrar pedidos locales o de mostrador.
- **Crear Venta:** Añade productos de la lista. Puedes buscar por nombre.
- **Mesas/Llevar:** Selecciona el modo de entrega.
- **Ticket Digital:** Al confirmar la venta, se genera un ticket. Puedes copiar el link para enviarlo por WhatsApp. PROHIBIDO mandar el total por texto; siempre manda el link del ticket.
- **Estado PENDING:** Los tickets nuevos aparecen como pendientes hasta que los marques como COBRADOS.

## 2. PEDIDOS CLIENTES
Aquí recibes los pedidos que llegan directamente desde la web pública.
- **Streaming:** No necesitas refrescar la página. Los pedidos aparecen en tiempo real con un sonido de notificación.
- **Control de Estado:** Cambia de PENDIENTE a ENTREGADO para mantener el flujo.

## 3. INVENTARIO
Control de existencias de tu materia prima y mercadería.
- **Límite Mínimo:** Configura este valor para cada item. Si el stock baja de este número, el item se marcará en rojo como "BAJO STOCK".
- **Unidades:** Puedes usar unidades, kg, litros, etc.

## 4. PEDIDOS PROVEEDOR (SUMINISTROS)
Es la forma principal de cargar stock.
- **Registro de Compra:** Cuando compras mercadería, regístrala aquí. 
- **Sincronización:** Al finalizar el pedido, el stock se suma automáticamente al Inventario sin que tengas que hacerlo a mano.
- **Nuevos Items:** Si el proveedor te trae algo que no tienes en el sistema, puedes crearlo ahí mismo y el sistema te pedirá el Stock Mínimo.

## 5. CARTA Y PRODUCTOS
- **Productos:** Es la base de datos de lo que vendes (ej: Hamburguesa Duke). Aquí subes la foto y pones la descripción.
    - **Recorte de Imágenes:** Al editar un producto con foto, puedes usar el botón **"Recortar imagen actual"** para ajustar el encuadre de la fotografía existente sin tener que subirla de nuevo.
- **Carta:** Es lo que el cliente ve en la web. Aquí defines el PRECIO y la CATEGORÍA.
- **Promos:** Secciones especiales. Puedes elegir qué días de la semana está activa una oferta (ej: Martes 2x1).

## 6. CONTABILIDAD
- **Balance:** El sistema suma todas las VENTAS y resta todos los GASTOS y COMPRAS DE PROVEEDOR.
- **Movimientos:** Usa el botón **"NUEVO MOVIMIENTO"** en el Dashboard o Contabilidad para registrar ingresos extra o gastos (Luz, Sueldos, etc.) de forma rápida mediante el modal unificado.

## 7. CONFIGURACIÓN
- **Horarios:** Define a qué hora abre y cierra el local cada día. Si está marcado como CERRADO, la web no permitirá pedidos.
- **Delivery:** San Juan está configurado por KM.
    - Menos de 1km: Precio Base.
    - Más de 1km: Distancia * Precio por KM.
    - El sistema redondea automáticamente a múltiplos de $100 para facilitar el cambio.

## 8. GALERÍA
Arrastra y suelta para ordenar las fotos que aparecen en el carrusel de la página principal.

---
## 9. DUKE ASSIST (ASISTENTE IA)
El asistente de Duke tiene acceso en tiempo real a la base de datos para ayudarte a tomar decisiones inteligentes.
- **Qué puede ver:**
    - Resúmenes financieros **Diarios, Semanales y Mensuales** (incluyendo comparativa histórica de 6 meses).
    - **Productos más vendidos** (Top 5 semanal con cantidades).
    - Artículos con bajo stock (Stock Crítico) y niveles de inventario completo.
    - Pedidos pendientes en TPV y Proveedores.
    - Movimientos recientes realizados por el staff (Auditoría).
- **Ejemplos de preguntas:** 
    - "¿Qué fue lo que más se vendió esta semana?"
    - "¿En qué mes tuvimos más gastos el último semestre?"
    - "¿Cómo viene el balance de la semana?"
    - "¿Qué insumos tengo que comprar urgente?"
    - "¿Quién borró el producto X o cargó el último gasto?"
    - "¿Cuántas unidades de papas fritas quedan?"

---
## 10. MAPA DE INTERFAZ Y UTILIDADES (REFERENCIA PARA IA)

Esta sección detalla la ubicación exacta de cada control para que el Asistente Duke pueda guiarte.

### 🏠 DASHBOARD (PANEL PRINCIPAL)
- **Stock Crítico (Centro):** Listado de insumos que están por debajo del mínimo (Color Rojo).
- **Resumen Financiero (Derecha):** Tarjetas con Ventas de Hoy, Gastos y Balance.
- **NUEVO MOVIMIENTO (Botón Negro):** Abre directamente el modal de contabilidad.
- **CONTROL DE COCINA (Botón Utensils):** Abre un monitor con los pedidos "En Cocción", "Listos" y "Recogidos". Desde aquí puedes adelantar estados o marcar pedidos como entregados.
- **Últimos Pedidos (Abajo):** Acceso rápido a las ventas más recientes.

### 🛒 TPV (VENTAS)
- **Pestaña TPV (Superior):** Muestra la carta para añadir productos al ticket.
- **Pestaña PENDIENTES (Superior):** Listado de tickets que aún no se han cobrado.
- **ESTADO COCINA (Botón Negro):** Abre un resumen de lo que está marchando en cocina sin salir del TPV.
- **Selector de Categorías (Bajo pestañas):** Botones para filtrar la carta (Burgers, Pizzas, etc).
- **Barra de Búsqueda (Arriba a la derecha):** Filtro rápido por nombre de producto.
- **Sidebar de Ticket (Derecha):** 
    - **Campos:** Nombre de Cliente, Notas de Pedido.
    - **Botón Ubicación (Pin):** Abre el calculador de distancia por GPS para envíos.
    - **Botón CONFIRMAR (Abajo Derecha):** Guarda la venta y genera el ticket.

### 📦 INVENTARIO
- **Buscador (Arriba Izquierda):** Localiza insumos rápidamente.
- **Botones Exportar (Arriba Derecha):** Iconos de Excel (Verde) y PDF (Rojo) para descargar el stock actual.
- **Formulario de Registro (Franja Gris):** 5 campos alineados para crear nuevos artículos.
- **Control de Stock (Tabla):** El ícono del lápiz permite editar la cantidad actual y el stock mínimo.

### 💰 CONTABILIDAD
- **DIARIO/SEMANAL/MENSUAL (Selector):** Cambia el periodo de tiempo de los reportes.
- **Botón NUEVO MOVIMIENTO (Botón Negro):** Activa el modal para registrar un Ingreso o Gasto Manual.
- **Filtros Avanzados (Botón Filtro):** Permite filtrar por fechas exactas (Desde/Hasta).
- **Reportes (Excel/PDF):** Ubicados junto a los filtros para bajar el historial filtrado.

### 🤖 DUKE ASSIST (BOTÓN FLOTANTE)
- **Ubicación:** Círculo con logo de Duke en la **Esquina Inferior Derecha** de toda la aplicación. Siempre visible.

---
## 11. SISTEMA DE TIEMPO REAL (SSE)
- **Monitoreo Continuo:** El sistema utiliza una conexión persistente (Server-Sent Events) para recibir pedidos de la web sin recargar. 
- **Frecuencia:** El servidor comprueba nuevos pedidos cada 15 segundos para optimizar el rendimiento.
- **Indicador de Salud:** En la barra lateral (Sidebar), verás un pequeño punto junto al nombre de Duke:
    - **Verde:** Conexión activa y recibiendo pedidos.
    - **Rojo/Amarillo:** Intentando reconectar automáticamente.
- **Notificaciones:** Los pedidos nuevos activan un mensaje emergente (Toast) en la parte superior de color verde.

---
**CONSEJO DUKE:** Revisa siempre la sección "Stock Crítico" en el Dashboard para no quedarte sin insumos en medio del servicio.
