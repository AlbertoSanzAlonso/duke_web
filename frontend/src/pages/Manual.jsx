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
  HelpCircle
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
        'Buscador superior: Filtra productos por nombre rápidamente.',
        'Botón Cobrar: Finaliza la venta y genera el ticket.',
        'Tickets Pendientes: Listado inferior para cuentas sin cerrar.'
      ]
    },
    { 
      id: 'cocina',
      name: 'Monitor de Cocina', 
      role: 'PARA: EQUIPO DE COCINA',
      url: 'https://dukeburger-sj.com/admin/cocina', 
      desc: 'Visible en el menú lateral. Pantalla dedicada para organizar la producción por orden de prioridad.',
      image: '/manual/kitchen.webp',
      features: [
        'Cards de Pedido: Cada pedido es una tarjeta con su tiempo transcurrido.',
        'Botón "Listo": En la card del pedido para avisar al cajero.',
        'Botón "Entregado": Para archivar el pedido una vez despachado.',
        'Historial: Botón superior derecho para ver los platos de hoy.'
      ]
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
          desc: 'Pestaña "General". Ajusta montos de delivery en los campos centrales.',
          image: '/manual/configuracion.webp'
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
        'Barra de Pestañas: Localizada arriba para cambiar de sección técnica.',
        'Botón "Guardar": Siempre visible abajo para confirmar los cambios.',
        'Selector de Redondeo: Ajusta los múltiplos de precio ($100, $500, etc).'
      ],
      color: '#34495e',
      url: 'https://dukeburger-sj.com/admin/config'
    },
    {
      id: 'asistente',
      title: 'Duke Assist (IA)',
      icon: <Sparkles className="section-icon" />,
      description: 'Asistente inteligente con acceso a datos reales.',
      items: [
        'Responde preguntas sobre ventas y stock.',
        'Analiza tendencias financieras.',
        'Siempre disponible en el botón flotante.'
      ],
      color: '#e31b23'
    }
  ];


  const faqs = [
    { 
      q: '¿Flujo de Pedido Web (Online)?', 
      a: 'Descubre cómo viaja un pedido desde la web hasta la cocina.',
      longDesc: 'Cuando un cliente pide desde la web: 1. El pedido llega al Panel de Gestión (Sonido de alerta) y al TPV. 2. Se envía automáticamente al Monitor de Cocina. 3. Los administradores pueden imprimir el ticket y coordinar el delivery.',
      linkTo: 'pedidos'
    },
    { 
      q: '¿Flujo de Pedido en Local (TPV)?', 
      a: 'Optimiza la atención presencial usando el Punto de Venta.',
      longDesc: 'Para pedidos en persona: 1. El cajero marca los productos en el TPV. 2. Al confirmar, el pedido aparece instantáneamente en el Monitor de Cocina. 3. Se genera un ticket físico o digital que se puede enviar por WhatsApp al cliente.',
      linkTo: 'tpv'
    },
    { 
      q: '¿Cómo funcionan las notificaciones (TPV, WhatsApp, Cocina)?', 
      a: 'Sincronización total en tiempo real para evitar retrasos.',
      longDesc: 'El sistema utiliza tecnología SSE para comunicación instantánea. Cuando entra un pedido web, se dispara una notificación sonora en el Panel y aparece en el listado del TPV. Al mismo tiempo, el Monitor de Cocina recibe el comanda sin intervención humana. Si el cliente solicita ticket por WhatsApp, el TPV abre un link directo con el mensaje pre-armado.',
      linkTo: 'admin'
    },
    { 
      q: '¿Cómo cambio el horario?', 
      a: 'Ajusta la disponibilidad semanal desde el Panel de Administración.',
      longDesc: 'Para modificar los horarios de atención que ven tus clientes, dirígete a la sección de Configuración y pulsa en la pestaña de Horarios. Podrás definir la hora de apertura y cierre para cada día de la semana. Los cambios se guardan al instante y afectan a la posibilidad de realizar pedidos online.',
      linkTo: 'configuracion'
    },
    { 
      q: '¿Cómo cambio las promos?', 
      a: 'Gestiona banners y ofertas activas en el módulo de Promociones.',
      longDesc: 'Las promociones se gestionan desde su propio módulo en el panel lateral. Puedes crear nuevas ofertas, asignarles una imagen atractiva y, lo más importante, decidir en qué días de la semana deben aparecer publicadas de forma automática.',
      linkTo: 'asistente'
    },
    { 
      q: '¿Cómo cambio las imágenes de la galería?', 
      a: 'Sube y reordena fotos del local desde Configuración.',
      longDesc: 'Las fotos del carrusel principal de la web se gestionan en Configuración > Galería. Puedes subir nuevas capturas y usar el icono de las flechas para reordenarlas arrastrando cada card. Esto permite destacar las imágenes que prefieras que el cliente vea primero.',
      linkTo: 'configuracion'
    },
    { 
      q: '¿Cómo añado/quito/modifico artículos?', 
      a: 'Usa Inventario para insumos o Productos para el catálogo general.',
      longDesc: 'Dependiendo de lo que quieras modificar: si es un insumo (como "Carne" o "Pan"), usa el módulo de Inventario. Si es un producto final que vendes (como "Burger Duke"), usa el módulo de Productos para editar su descripción o stock base.',
      linkTo: 'inventario'
    },
    { 
      q: '¿Cómo creo un nuevo usuario?', 
      a: 'Administra el personal desde Configuración > Personal.',
      longDesc: 'Para dar de alta a un nuevo empleado, ve a Configuración y entra en la pestaña de Personal. Pulsa en "+ Nuevo Usuario", introduce sus datos y asígnale los permisos necesarios según su función en el local (Cajero, Cocinero, Administrador).',
      linkTo: 'usuarios'
    },
    { 
      q: '¿Cómo manejo tickets?', 
      a: 'Usa el TPV para generar tickets y cobrarlos en mostrador.',
      longDesc: 'El TPV (Punto de Venta) es el centro de operaciones diario. Desde allí generas los pedidos locales, imprimes tickets y gestionas las cuentas pendientes que aún no han sido cobradas.',
      linkTo: 'tpv'
    },
    { 
      q: '¿Cómo manejo pedidos al proveedor?', 
      a: 'Registra compras en el módulo de Pedidos del Inventario.',
      longDesc: 'Cuando compras mercancía, regístrala como un "Pedido a Proveedor" dentro del módulo de Inventario. Al marcarlo como "Recibido", el sistema sumará automáticamente esas cantidades al stock disponible de cada insumo.',
      linkTo: 'inventario'
    },
    { 
      q: '¿Cómo manejo pedidos de clientes?', 
      a: 'Consulta y procesa ventas online en Gestión de Pedidos.',
      longDesc: 'Todos los pedidos que los clientes realizan desde su móvil llegan a "Gestión de Pedidos". Desde aquí puedes controlar el flujo: ver el ticket, enviarlo a cocina y marcarlo como entregado una vez que el cliente lo recibe.',
      linkTo: 'pedidos'
    },
    { 
      q: '¿Cómo funciona la carta?', 
      a: 'Publica productos y asigna precios en Menú Online.',
      longDesc: 'El catálogo de Productos es tu "almacén" de ítems, pero el "Menú Online" es tu "vitrina". Solo los productos que actives en el Menú Online con un precio asignado serán visibles para los clientes en la web.',
      linkTo: 'carta'
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
              <div className="faq-detail-body">
                <p className="faq-long-desc">{selectedFAQ.longDesc}</p>
                
                {selectedFAQ.linkTo && (
                  <div className="faq-link-section">
                    <p>Módulo relacionado:</p>
                    <button 
                      className="faq-link-btn" 
                      onClick={() => {
                        const target = modules.find(m => m.id === selectedFAQ.linkTo) || 
                                     mainRoutes.find(r => r.id === selectedFAQ.linkTo);
                        if (target) {
                          setSelectedDetail(target);
                          setSelectedFAQ(null);
                        }
                      }}
                    >
                      <ExternalLink size={18} /> Ver {selectedFAQ.linkTo.toUpperCase()}
                    </button>
                  </div>
                )}
              </div>
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
                    <div className="zoom-hint"><Maximize2 size={20} /> Click para ampliar</div>
                  </div>
                  <div className="image-caption">Captura real: {drillDown ? drillDown.title : (selectedDetail.name || selectedDetail.title)}</div>
                </div>
              )}
              <div className="modal-info">
                <p className="detail-desc">{drillDown ? drillDown.longDesc : (selectedDetail.desc || selectedDetail.description)}</p>
                
                {!drillDown && selectedDetail.dashboardElements && (
                  <div className="dashboard-structure">
                    <h3>Elementos del Panel (Click para ver detalle):</h3>
                    <div className="insight-drill-grid">
                      {selectedDetail.dashboardElements.map((el, i) => (
                        <button key={i} className="insight-btn" onClick={() => setDrillDown(el)}>
                          <div className="btn-icon">{el.icon}</div>
                          <div className="btn-text">
                            <strong>{el.title}</strong>
                            <span>{el.desc}</span>
                          </div>
                          <Maximize2 size={16} className="drill-icon" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!drillDown && selectedDetail.subSections && (
                  <div className="sub-sections-list">
                    {selectedDetail.subSections.map((sub, idx) => (
                      <div key={idx} className="manual-sub-section">
                        <h4>{sub.title}</h4>
                        <p>{sub.desc}</p>
                        {sub.image && (
                          <div className="sub-image-wrapper" onClick={() => { setSelectedDetail({...selectedDetail, image: sub.image}); setIsZoomed(true); }}>
                            <img src={sub.image} alt={sub.title} />
                            <div className="zoom-hint"><Maximize2 size={16} /> Ver en grande</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedDetail.id === 'pedidos' && (
                  <div className="extra-info-grid">
                    <div className="info-item"><Search size={16} /> <strong>Buscador:</strong> Filtra por ID o Nombre.</div>
                    <div className="info-item"><Filter size={16} /> <strong>Filtros:</strong> Por fecha y estado.</div>
                    <div className="info-item"><Download size={16} /> <strong>Excel/PDF:</strong> Botones de descarga rápida.</div>
                  </div>
                )}

                {selectedDetail.id === 'inventario' && (
                  <div className="extra-info-grid">
                    <div className="info-item"><PlusCircle size={16} /> <strong>Registro:</strong> Formulario rápido superior.</div>
                    <div className="info-item"><AlertTriangle size={16} /> <strong>Stock Mínimo:</strong> Alertas visuales automáticas.</div>
                    <div className="info-item"><Package size={16} /> <strong>Unidades:</strong> Soporta Kg, Unidades, Cajas, etc.</div>
                  </div>
                )}

                {selectedDetail.id === 'finanzas' && (
                  <div className="extra-info-grid">
                    <div className="info-item"><TrendingUp size={16} /> <strong>Beneficio:</strong> Cálculo neto automático.</div>
                    <div className="info-item"><PlusCircle size={16} /> <strong>Movimientos:</strong> Registro manual de gastos.</div>
                    <div className="info-item"><Clock size={16} /> <strong>Periodos:</strong> Diario, Semanal y Mensual.</div>
                  </div>
                )}

                <h3 style={{ marginTop: '20px' }}>Funcionalidades Clave:</h3>
                <ul className="detail-features">
                  {(selectedDetail.features || selectedDetail.items).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                {selectedDetail.url && (
                  <a href={selectedDetail.url} target="_blank" rel="noreferrer" className="jump-to-url">
                    IR AL MÓDULO EN VIVO <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="manual-nav">
        <div className="nav-container">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
            <span>VOLVER</span>
          </button>
          <img src="/brand/duke burger 2 negativo.png" alt="Duke Logo" className="manual-logo" />
        </div>
      </nav>

      <header className="manual-hero">
        <div className="container">
          <h1 className="hero-title">CENTRO DE <span>AYUDA</span></h1>
          <p className="hero-subtitle">Haz clic en cualquier sección para ver la explicación completa a pantalla completa.</p>
        </div>
      </header>

      <main className="manual-content">
        <div className="container">
          <section className="urls-section">
            <h2 className="section-title">Mapa de Rutas Principales</h2>
            <div className="route-map-grid">
              {mainRoutes.map(route => (
                <div key={route.id} className="route-card" onClick={() => setSelectedDetail(route)}>
                  <div className="route-header">
                    <span className="route-badge role-badge">{route.role}</span>
                    <code className="url-code">{route.url}</code>
                  </div>
                  <h3>{route.name}</h3>
                  <p>{route.desc}</p>
                  <div className="route-action-hint">Ver Guía Completa →</div>
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
                    <div className="icon-wrapper">
                      {module.icon}
                    </div>
                    <h3>{module.title}</h3>
                  </div>
                  <p className="card-desc">{module.description}</p>
                  <div className="card-action-hint">Explorar funcionalidades</div>
                </div>
              ))}
            </div>
          </section>

          <section className="faq-section">
            <h2 className="section-title">Preguntas Frecuentes (FAQ)</h2>
            <div className="faq-column">
              {faqs.map((faq, i) => (
                <button key={i} className="faq-row-btn" onClick={() => setSelectedFAQ(faq)}>
                  <div className="faq-row-content">
                    <HelpCircle size={18} className="faq-icon" />
                    <span className="faq-q">{faq.q}</span>
                  </div>
                  <Maximize2 size={16} className="faq-arrow" />
                </button>
              ))}
            </div>
          </section>

          <section className="setup-section">
            <div className="setup-grid">
              <div className="setup-card">
                <h3><Clock size={24} /> Horarios y Delivery</h3>
                <p>Configura la disponibilidad del local y los costos de envío por kilómetro desde el panel de Administración.</p>
              </div>
              <div className="setup-card">
                <h3><Smartphone size={24} /> Web Pública</h3>
                <p>Sincronización instantánea de stock y precios para tus clientes.</p>
              </div>
              <div className="setup-card">
                <h3><Sparkles size={24} /> Duke Assist</h3>
                <p>Consulta cualquier duda operativa mediante el asistente inteligente.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="manual-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} DUKE BURGER - SISTEMA DE GESTIÓN HEARTBEAT</p>
        </div>
      </footer>
    </div>
  );
};

export default Manual;
