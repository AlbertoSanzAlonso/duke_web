import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Terminal, 
  ChefHat, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Sparkles, 
  Clock,
  Smartphone,
  ExternalLink,
  X,
  Search,
  Filter,
  Download,
  Maximize2,
  PlusCircle,
  AlertTriangle,
  LayoutDashboard,
  Mail,
  ClipboardList,
  Settings,
  HelpCircle,
  Truck
} from 'lucide-react';
import './Manual.css';

const Manual = () => {
  const navigate = useNavigate();
  const [selectedDetail, setSelectedDetail] = React.useState(null);
  const [selectedFAQ, setSelectedFAQ] = React.useState(null);
  const [drillDown, setDrillDown] = React.useState(null);
  const [isZoomed, setIsZoomed] = React.useState(false);

  const mainRoutes = [
    { 
      id: 'admin',
      name: 'Panel de Administración', 
      role: 'PARA: ADMINISTRADORES / DUEÑOS',
      url: 'https://dukeburger-sj.com/admin', 
      desc: 'Centro de control estratégico accesible desde el inicio. Supervisa finanzas, stock crítico y configura parámetros globales.',
      image: '/manual/admin.webp',
      features: [
        'Dashboard: Resumen visual nada más entrar.',
        'Alertas Stock: Indicadores rojos en la parte inferior del dash.',
        'Configuración: Pestañas superiores para ajustes maestros.',
        'Personal: Gestión de permisos desde Usuarios.'
      ],
      dashboardElements: [
        { 
          id: 'insights_pedidos',
          title: 'Pedidos de Hoy', 
          desc: 'Resumen en la parte superior izquierda del Dashboard.', 
          icon: <ShoppingBag size={18} />, 
          image: '/manual/admin.webp',
          longDesc: 'Ubicado en la primera tarjeta del Dashboard. Muestra el total de ventas del día. Al hacer clic en el número de "Pendientes", el sistema te redirige automáticamente al listado de pedidos para gestionarlos.',
          linkTo: 'pedidos' 
        },
        { 
          id: 'insights_cocina',
          title: 'Estado Cocina', 
          desc: 'Segunda tarjeta del Dashboard. Control de tiempos.', 
          icon: <ChefHat size={18} />, 
          image: '/manual/kitchen.webp',
          longDesc: 'Muestra cuántos pedidos hay "En Cocción" y cuántos están "Listos". Puedes pulsar el botón "Ver más" para abrir el monitor de cocina completo y gestionar prioridades.',
          linkTo: 'cocina' 
        },
        { 
          id: 'insights_stock',
          title: 'Alertas de Stock', 
          desc: 'Tarjeta roja en la fila superior cuando hay faltantes.', 
          icon: <AlertTriangle size={18} />, 
          image: '/manual/inventario.webp',
          longDesc: 'Aparece resaltada en rojo si algún insumo baja del mínimo. Haz clic en la tarjeta para ir directamente al Almacén y ver qué artículos necesitan reposición urgente.',
          linkTo: 'inventario' 
        },
        { 
          id: 'insights_sistema',
          title: 'Sistema', 
          desc: 'Última tarjeta del Dashboard o vía "Configuración" en el lateral.', 
          icon: <Settings size={18} />, 
          image: '/manual/configuracion.webp',
          longDesc: 'Desde aquí controlas los pilares del negocio. Pulsa el botón para acceder a la configuración de GPS, tarifas de envío y horarios de apertura de la web.',
          linkTo: 'configuracion' 
        }
      ]
    },
    { 
      id: 'tpv',
      name: 'TPV (Punto de Venta)', 
      role: 'PARA: CAJEROS / ATENCIÓN',
      url: 'https://dukeburger-sj.com/admin/tpv', 
      desc: 'Localizado en el menú lateral. Interfaz táctil para cobros rápidos y gestión de pedidos físicos.',
      image: '/manual/tpv.webp',
      features: [
        'Carrito Lateral: Los productos elegidos aparecen a la derecha.',
        'Icono Regalo: Indica que el producto es una cortesía ($0).',
        'Icono Descuento: Indica un porcentaje de rebaja aplicado al ítem.',
        'Botón Cobrar: Finaliza la venta y genera el ticket.',
        'Tickets Pendientes: Listado inferior para cuentas sin cerrar.'
      ],
      example: 'Llega un cumpleañero y le regalas una bebida. Pulsas el icono de regalo en el carrito para que el precio pase a $0 y el stock se descuente igual.'
    },
    { 
      id: 'cocina',
      name: 'Monitor de Cocina', 
      role: 'PARA: EQUIPO DE COCINA',
      url: 'https://dukeburger-sj.com/admin/cocina', 
      desc: 'Visible en el menú lateral. Pantalla dedicada para organizar la producción por orden de llegada.',
      image: '/manual/kitchen.webp',
      features: [
        'Estado "En Cocción" (Naranja): Se activa al empezar a preparar el plato.',
        'Estado "Listo" (Verde): Avisa al cajero que el pedido puede retirarse.',
        'Estado "Entregado": Archiva el pedido y lo quita de la pantalla principal.',
        'Tiempo de Espera: Cada card muestra cuánto lleva el cliente esperando.'
      ],
      example: 'Entra un pedido. Pulsas el botón de la card para pasarlo a "En Cocción". Cuando terminas las burgers, pulsas "Listo" para que el cajero sepa que debe entregarlo.'
    }
  ];

  const modules = [
    {
      id: 'carta',
      title: 'Menú Online',
      icon: <LayoutDashboard className="section-icon" />,
      description: 'Accede desde "Carta" en el panel lateral. Controla qué vendes en la web.',
      image: '/manual/carta.webp',
      features: [
        'Añadir Producto: Selector superior para publicar ítems del catálogo.',
        'Botón "Retirar": En cada card de producto para ocultarlo de la web.',
        'Filtros Superiores: Navega entre Burgers, Pizzas, Bebidas, etc.',
        'Edición de Precios: Escribe el valor directamente en el campo de la tarjeta.'
      ],
      color: '#e67e22',
      url: 'https://dukeburger-sj.com/admin/carta'
    },
    {
      id: 'pedidos',
      title: 'Gestión de Pedidos',
      icon: <ShoppingBag className="section-icon" />,
      description: 'Módulo "Pedidos Clientes" en el lateral. Control de ventas online.',
      image: '/manual/pedidos.webp',
      features: [
        'Barra de Filtros: En la parte superior (Hoy, Última Semana, Mes).',
        'Botones de Exportación: Iconos de Excel y PDF arriba a la derecha.',
        'Acción "Ver": Haz clic en la lupa de cada fila para ver el ticket completo.',
        'Buscador: Campo de texto superior para filtrar por cliente o ID.'
      ],
      color: '#ffffff',
      example: 'Busca el pedido #1042, haz clic en el icono del ticket y coordina el envío con el cliente.',
      url: 'https://dukeburger-sj.com/admin/pedidos-clientes'
    },
    {
      id: 'inventario',
      title: 'Almacén de Insumos',
      icon: <Package className="section-icon" />,
      description: 'Módulo "Inventario" en el lateral. Gestión de stock de materia prima.',
      image: '/manual/inventario.webp',
      features: [
        'Formulario de Alta: En la parte superior para añadir nuevos insumos.',
        'Tabla de Stock: Indica cantidad, medida y alertas de mínimo.',
        'Botón "Ajustar": Icono de lápiz para corregir stock manualmente.',
        'Alertas Rojas: Fila resaltada automáticamente si falta mercancía.'
      ],
      color: '#2ecc71',
      example: 'Añade "Carne Vacuna 15kg" usando el formulario superior para actualizar el almacén tras recibir al proveedor.',
      url: 'https://dukeburger-sj.com/admin/inventario'
    },
    {
      id: 'finanzas',
      title: 'Contabilidad Duke',
      icon: <TrendingUp className="section-icon" />,
      description: 'Módulo "Contabilidad" en el lateral. Balance de caja y gastos.',
      image: '/manual/contabilidad.webp',
      features: [
        'Dashboard Financiero: 3 tarjetas superiores (Ingresos, Gastos, Neto).',
        'Botón "+ Movimiento": Azul, arriba a la derecha para añadir gastos.',
        'Filtros de Mes: Selector superior para ver balances históricos.',
        'Listado: Tabla inferior con el detalle de cada movimiento de dinero.'
      ],
      color: '#9b59b6',
      example: 'Pulsa "+ Nuevo Movimiento" y registra un gasto de "$5.000" bajo el concepto "Reparación Luz" para cuadrar caja.',
      url: 'https://dukeburger-sj.com/admin/contabilidad'
    },
    {
      id: 'configuracion',
      title: 'Configuración Duke',
      icon: <Settings className="section-icon" />,
      description: 'Módulo "Configuración" (icono engranaje) o desde el Dashboard.',
      image: '/manual/configuracion.webp',
      subSections: [
        {
          title: 'Parámetros de Envío',
          desc: 'Ajusta el precio base, el plus por cada kilómetro recorrido y el radio máximo de entrega (GPS). Cuando un cliente introduce su dirección en la web, el sistema calcula automáticamente la distancia y el costo exacto del envío.',
          image: '/manual/configuracion_envio.webp'
        },
        {
          title: 'Gestión de Horarios',
          desc: 'Pestaña "Horarios". Usa los selectores para definir apertura y cierre diaria.',
          image: '/manual/horarios.webp'
        },
        {
          title: 'Galería Local',
          desc: 'Pestaña "Galería". Botón "Subir Imagen" arriba y flechas para reordenar.',
          image: '/manual/galeria.webp'
        },
        {
          title: 'Gestión de Usuarios',
          desc: 'Pestaña "Personal". Botón "+ Nuevo Usuario" para añadir staff.',
          image: '/manual/usuarios.webp'
        }
      ],
      features: [
        'Cálculo Automático: Precio basado en la dirección del cliente + GPS.',
        'Barra de Pestañas: Localizada arriba para cambiar de sección técnica.',
        'Botón "Guardar": Siempre visible abajo para confirmar los cambios.',
        'Selector de Redondeo: Ajusta los múltiplos de precio ($100, $500, etc).'
      ],
      color: '#34495e',
      example: 'Cambia el "Plus por KM" a $1.200 si necesitas ajustar las tarifas por el precio de la nafta.',
      url: 'https://dukeburger-sj.com/admin/config'
    },
    {
      id: 'asistente',
      title: 'Duke Assist (IA)',
      icon: <Sparkles className="section-icon" />,
      description: 'Asistente de Inteligencia Artificial con acceso total a la base de datos operativa de Duke Burger.',
      image: '/manual/asistente_ui.webp',
      features: [
        'Ventana Adaptable: Puedes **agrandar** la ventana con el icono superior derecho o **cerrarla** con la "X".',
        'Analítica de Ventas: "¿Cuánto ganamos ayer?", "¿Cuál fue el mejor día de la semana?".',
        'Auditoría de Stock: "¿Hay pan de papa?", "¿Qué insumos están criticamente bajos?".',
        'Seguridad y Logs: "¿Quién borró el pedido #1020?", "¿Quién editó el precio de la Duke?".',
        'Soporte Técnico: "¿Cómo cambio el radio del GPS?", "¿Cómo se borra un usuario?".',
        'Memoria de Contexto: Recuerda historial financiero de los últimos 6 meses.'
      ],
      example: 'Escribe: "¿Qué fue lo que más se vendió el martes?" o "¿Tengo stock suficiente de gaseosas para hoy?"',
      subSections: [
        {
          title: 'Gestión de Ventana',
          desc: 'La interfaz es flexible. Usa el icono de flechas arriba a la derecha para expandir el chat a pantalla completa o la "X" para ocultarlo cuando no lo necesites.',
          image: '/manual/asistente_ui.webp'
        }
      ],
      color: '#e31b23',
      url: '#'
    }
  ];

  const productWorkflowSteps = [
    {
      title: '1. Inventariado de Almacén',
      desc: 'Creación de insumos base en el inventario. Define la unidad de medida y pack (ej: Cajas de queso, 40 unidades por caja) y carga el stock inicial disponible.',
      icon: <Package size={24} />,
      color: '#2ecc71'
    },
    {
      title: '2. Definición de Recetas',
      desc: 'Asocia los insumos a tus Productos del catálogo. Especifica qué y cuánto consume cada plato (ej: Burger Duke = 2u queso + 0.3kg carne).',
      icon: <ClipboardList size={24} />,
      color: '#3498db'
    },
    {
      title: '3. Publicación en Carta',
      desc: 'Elige qué productos del catálogo quieres vender online, asígnales un precio y mantenlos activos para que aparezcan en la web del cliente.',
      icon: <LayoutDashboard size={24} />,
      color: '#e67e22'
    },
    {
      title: '4. Recepción de Pedido',
      desc: 'Cuando un cliente pide desde la web o el TPV, el pedido entra instantáneamente en Cocina ("En Cocción") y queda registrado en el TPV como pendiente.',
      icon: <Smartphone size={24} />,
      color: '#e74c3c'
    },
    {
      title: '5. Cocción y Despacho',
      desc: 'Cocina marca como "Listo" al terminar. Desde el TPV o Cocina se marca como "Recogido", indicando que el producto salió hacia el cliente.',
      icon: <ChefHat size={24} />,
      color: '#27ae60'
    },
    {
      title: '6. Deducción Automática',
      desc: 'Al marcarse como cobrado en el TPV, el sistema descuenta automáticamente la materia prima del inventario según la receta definida.',
      icon: <TrendingUp size={24} />,
      color: '#9b59b6'
    },
    {
      title: '7. Reposición de Stock',
      desc: 'Registra la compra en "Pedidos al Proveedor". El stock se sumará solo. Puedes crear materiales nuevos desde allí si no existen.',
      icon: <Truck size={24} />,
      color: '#16a085'
    },
    {
      title: '8. Auditoría y Gastos',
      desc: 'Consulta el historial de ventas en "Pedidos Clientes" y los gastos operativos en "Contabilidad" para un balance financiero total.',
      icon: <TrendingUp size={24} />,
      color: '#2c3e50'
    }
  ];

  const faqs = [
    { 
      q: '¿Cómo gestiono los permisos de mi equipo?', 
      a: 'Asigna roles específicos para cada función en el local.',
      longDesc: 'Desde Configuración > Personal, puedes editar cada usuario y asignarle un Nivel de Acceso específico.',
      example: 'Un cajero nuevo solo necesita el rol "TPV". Así podrá cobrar, pero no podrá ver los balances de ganancias del mes.',
      linkTo: 'configuracion'
    },
    { 
      q: '¿Cómo se calcula el precio de envío?', 
      a: 'Transparencia total basada en GPS y tarifas por KM.',
      longDesc: 'El sistema usa la fórmula: [Precio Base] + ([Distancia en KM] * [Precio por KM]), redondeando al siguiente múltiplo de $100.',
      example: 'Base: $1000, Plus/KM: $200, Distancia: 3km. Total: $1.600.',
      linkTo: 'configuracion'
    }
  ];

  return (
    <div className="manual-page">
      <Helmet>
        <title>Manual de Usuario | Duke Burger Admin</title>
      </Helmet>

      {selectedFAQ && (
        <div className="manual-modal-overlay faq-modal" onClick={() => setSelectedFAQ(null)}>
          <div className="manual-modal-container faq-view" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <HelpCircle className="faq-modal-icon" />
                <h2>{selectedFAQ.q}</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedFAQ(null)}><X size={24} /></button>
            </div>
            <div className="modal-content">
              <p className="faq-long-desc">{selectedFAQ.longDesc}</p>
              {selectedFAQ.example && (
                <div className="example-box">
                  <strong>EJEMPLO PRÁCTICO:</strong>
                  <p>{selectedFAQ.example}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDetail && (
        <div className="manual-modal-overlay fullscreen" onClick={() => { setSelectedDetail(null); setDrillDown(null); setIsZoomed(false); }}>
          <div className="manual-modal-container fullscreen" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {drillDown ? <ArrowLeft className="clickable" onClick={() => setDrillDown(null)} /> : selectedDetail.icon}
                <h2>{drillDown ? drillDown.title : (selectedDetail.name || selectedDetail.title)}</h2>
              </div>
              <button className="close-btn" onClick={() => { setSelectedDetail(null); setDrillDown(null); setIsZoomed(false); }}><X size={24} /></button>
            </div>
            <div className="modal-content">
              {(drillDown?.image || selectedDetail.image) && (
                <div className="modal-image-box">
                  <div className={`image-wrapper ${isZoomed ? 'zoomed' : ''}`} onClick={() => setIsZoomed(!isZoomed)}>
                    <img src={drillDown ? drillDown.image : selectedDetail.image} alt="Capture" />
                  </div>
                </div>
              )}
              <div className="modal-info">
                <p className="detail-desc">{drillDown ? drillDown.longDesc : (selectedDetail.desc || selectedDetail.description)}</p>
                <ul className="detail-features">
                  {selectedDetail.features?.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="manual-nav">
        <div className="nav-container">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={20} /> VOLVER</button>
          <img src="/brand/duke burger 2 negativo.png" alt="Duke Logo" className="manual-logo" />
        </div>
      </nav>

      <header className="manual-hero">
        <div className="container">
          <h1 className="hero-title">CENTRO DE <span>AYUDA</span></h1>
        </div>
      </header>

      <main className="manual-content">
        <div className="container">
          <section className="workflow-section">
            <h2 className="section-title">Flujo de Trabajo: Vida del Producto</h2>
            <div className="workflow-timeline">
              {productWorkflowSteps.map((step, index) => (
                <div key={index} className="workflow-step-card" style={{"--step-color": step.color}}>
                  <div className="step-number">{index + 1}</div>
                  <div className="step-icon-box">{step.icon}</div>
                  <div className="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="manual-grid-section">
            <h2 className="section-title">Módulos de Gestión</h2>
            <div className="manual-grid">
              {modules.map(module => (
                <div key={module.id} className="manual-card" style={{"--accent": module.color}} onClick={() => setSelectedDetail(module)}>
                  <div className="card-header">
                    <div className="icon-wrapper">{module.icon}</div>
                    <h3>{module.title}</h3>
                  </div>
                  <p className="card-desc">{module.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Manual;
