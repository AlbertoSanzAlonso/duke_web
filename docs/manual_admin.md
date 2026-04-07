# MANUAL DE USUARIO - DUKE BURGER ADMIN

¡Bienvenido al cerebro de Duke Burger! Este panel te permite controlar toda la operación de tu negocio.

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
- **Carta:** Es lo que el cliente ve en la web. Aquí defines el PRECIO y la CATEGORÍA.
- **Promos:** Secciones especiales. Puedes elegir qué días de la semana está activa una oferta (ej: Martes 2x1).

## 6. CONTABILIDAD
- **Balance:** El sistema suma todas las VENTAS y resta todos los GASTOS y COMPRAS DE PROVEEDOR.
- **Gastos:** Registra aquí facturas de luz, sueldos, alquiler, etc.

## 7. CONFIGURACIÓN
- **Horarios:** Define a qué hora abre y cierra el local cada día. Si está marcado como CERRADO, la web no permitirá pedidos.
- **Delivery:** San Juan está configurado por KM.
    - Menos de 1km: Precio Base.
    - Más de 1km: Distancia * Precio por KM.
    - El sistema redondea automáticamente a múltiplos de $100 para facilitar el cambio.

## 8. GALERÍA
Arrastra y suelta para ordenar las fotos que aparecen en el carrusel de la página principal.

---
**CONSEJO DUKE:** Revisa siempre la sección "Stock Crítico" en el Dashboard para no quedarte sin insumos en medio del servicio.
