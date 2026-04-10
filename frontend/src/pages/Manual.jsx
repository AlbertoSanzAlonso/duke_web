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
      desc: 'Centro de control estratégico para supervisar finanzas, stock crítico y configurar parámetros del sistema Duke.',
      image: '/manual/admin.webp',
      features: [
        'Dashboard operativo con métricas en tiempo real.',
        'Gestión avanzada de inventario y alertas de stock.',
        'Control financiero con historial de 6 meses.',
        'Configuración de horarios y tarifas de delivery.',
        'Gestión de usuarios y niveles de acceso.'
      ],
      dashboardElements: [
        { 
          id: 'insights_pedidos',
          title: 'Pedidos de Hoy', 
          desc: 'Resumen cuantitativo de ventas del día, tickets cobrados y pendientes.', 
          icon: <ShoppingBag size={18} />, 
          image: '/manual/admin.webp',
          longDesc: 'Este elemento muestra la actividad comercial del día en curso. Permite al administrador saber cuántos pedidos se han generado, cuántos ya han sido cobrados y cuántos están en espera de ser procesados o entregados.',
          linkTo: 'pedidos' 
        },
        { 
          id: 'insights_cocina',
          title: 'Estado Cocina', 
          desc: 'Vista rápida de la carga de trabajo en cocina (Listos vs En Cocción).', 
          icon: <ChefHat size={18} />, 
          image: '/manual/kitchen.webp',
          longDesc: 'Muestra en tiempo real la eficiencia operativa del equipo de producción. Ayuda a detectar cuellos de botella si el volumen de pedidos "En Cocción" es muy superior al de "Listos".',
          linkTo: 'cocina' 
        },
        { 
          id: 'insights_stock',
          title: 'Alertas de Stock', 
          desc: 'Indicador crítico de insumos agotados o por debajo del mínimo.', 
          icon: <AlertTriangle size={18} />, 
          image: '/manual/inventario.webp',
          longDesc: 'Notifica automáticamente cualquier ingrediente o producto que esté llegando a su límite crítico definido en el inventario. Ideal para realizar pedidos a proveedores a tiempo.',
          linkTo: 'inventario' 
        },
        { 
          id: 'insights_correo',
          title: 'Correo Corporativo', 
          desc: 'Bandeja de entrada para consultas directas desde el formulario web.', 
          icon: <Mail size={18} />,
          image: '/manual/admin.webp', // Pending real image
          longDesc: 'Canal de comunicación directa con el cliente. Aquí se reciben los mensajes enviados desde la sección de contacto de la web pública.'
        },
        { 
          id: 'insights_auditoria',
          title: 'Auditoría', 
          desc: 'Historial detallado de cada acción realizada en el sistema.', 
          icon: <ClipboardList size={18} />,
          image: '/manual/admin.webp', // Pending real image
          longDesc: 'Registro de seguridad que almacena el "Logs" de movimientos: quién entró, qué producto editó, qué pedido eliminó, etc.'
        },
        { 
          id: 'insights_sistema',
          title: 'Sistema', 
          desc: 'Acceso directo a la configuración global (Tarifas, Horarios, GPS).', 
          icon: <Settings size={18} />, 
          image: '/manual/configuracion.webp',
          longDesc: 'Ajustes estructurales de la aplicación. Cambiar el precio base del envío o modificar el radio de entrega afecta a todo el sistema al instante.',
          linkTo: 'configuracion' 
        }
      ]
    },
    { 
      id: 'tpv',
      name: 'TPV (Punto de Venta)', 
      role: 'PARA: CAJEROS / ATENCIÓN',
      url: 'https://dukeburger-sj.com/tpv', 
      desc: 'Terminal de ventas presencial optimizada para atención rápida, cobros y despacho de pedidos locales y web.',
      image: '/manual/tpv.webp',
      features: [
        'Interfaz táctil optimizada para rapidez.',
        'Cálculo automático de envíos por geolocalización.',
        'Generación de tickets digitales vía QR o WhatsApp.',
        'Sincronización instantánea con la cocina.',
        'Manejo de múltiples tickets pendientes simultáneos.'
      ]
    },
    { 
      id: 'cocina',
      name: 'Monitor de Cocina', 
      role: 'PARA: EQUIPO DE COCINA',
      url: 'https://dukeburger-sj.com/cocina', 
      desc: 'Entorno de trabajo para los cocineros enfocado en la preparación secuencial y aviso de platos listos.',
      image: '/manual/kitchen.webp',
      features: [
        'Visualización clara de pedidos por orden de llegada.',
        'Control de estados: En Cocción -> Listo -> Recogido.',
        'Alertas visuales para pedidos con mucha espera.',
        'Integración con el TPV para avisar al cajero automáticamente.',
        'Pantalla de historial de pedidos entregados hoy.'
      ]
    }
  ];

  const modules = [
    {
      id: 'carta',
      title: 'Menú Online',
      icon: <LayoutDashboard className="section-icon" />,
      description: 'Gestión de la carta pública y precios de venta.',
      image: '/manual/carta.webp',
      features: [
        'Publicación Instantánea: Elige productos del catálogo y hazlos visibles.',
        'Gestión de Precios: Define el valor de venta al público para la web.',
        'Filtros por Categoría: Burgers, Pachatas, Pizzas, Bebidas y Otros.',
        'Disponibilidad: Botón para retirar de la carta productos sin stock.',
        'Buscador: Localiza rápidamente cualquier producto publicado.'
      ],
      color: '#e67e22'
    },
    {
      id: 'pedidos',
      title: 'Gestión de Pedidos',
      icon: <ShoppingBag className="section-icon" />,
      description: 'Panel centralizado para administrar todos los pedidos entrantes de la web.',
      image: '/manual/pedidos.webp',
      features: [
        'Buscador Inteligente: Localiza pedidos por ID, Nombre o contenido.',
        'Filtros de Periodo: Segmentación por Hoy, Semana o Mes.',
        'Filtros de Estado: Clasifica entre Pendientes y Completados.',
        'Columnas Detalladas: Fecha, Cliente, Total y Estado.',
        'Exportación: Botones de Excel (Verde) y PDF (Rojo) para reportes.',
        'Acciones: Ver ticket, Imprimir y Cambio de estado rápido.'
      ],
      color: '#ffffff'
    },
    {
      id: 'inventario',
      title: 'Inventario de Almacén',
      icon: <Package className="section-icon" />,
      description: 'Control de materia prima y alertas de stock crítico.',
      image: '/manual/inventario.webp',
      features: [
        'Buscador de Artículos: Filtrado instantáneo por nombre de insumo.',
        'Registro Rápido: Formulario superior para añadir nuevos productos.',
        'Alertas de Stock Mínimo: El sistema avisa si un artículo está bajo.',
        'Ajuste manual de stock y unidades de medida (Kg, Unidades, Cajas).',
        'Exportación: Descarga el stock actual en Excel o PDF para auditoría.'
      ],
      color: '#2ecc71'
    },
    {
      id: 'finanzas',
      title: 'Contabilidad Duke',
      icon: <TrendingUp className="section-icon" />,
      description: 'Control de ingresos, gastos y balance de caja detallado.',
      image: '/manual/contabilidad.webp',
      features: [
        'Tarjetas de Resumen: Ingresos, Gastos y Beneficio Neto del periodo.',
        'Filtros Temporales: Consulta balance Diario, Semanal o Mensual.',
        'Registro de Movimientos: Botón "+ Nuevo Movimiento" para gastos manuales.',
        'Historial Detallado: Listado con Fecha, Tipo, Descripción e Importe.',
        'Auditoría: Seguimiento de origen (Venta TPV, Pago Proveedor, etc).'
      ],
      color: '#9b59b6'
    },
    {
      id: 'configuracion',
      title: 'Configuración Duke',
      icon: <Settings className="section-icon" />,
      description: 'Ajustes maestros del sistema, tarifas y personal.',
      image: '/manual/configuracion.webp',
      subSections: [
        {
          title: 'Parámetros de Envío',
          desc: 'Ajusta el precio base, el plus por kilometraje y el radio máximo de entrega (GPS). Guardar cambios aplica instantáneamente.',
          image: '/manual/configuracion.webp'
        },
        {
          title: 'Gestión de Horarios',
          desc: 'Define las franjas horarias de atención para cada día de la semana. Puedes marcar días como cerrados o abiertos las 24hs (00:00 a 00:00).',
          image: '/manual/horarios.webp'
        },
        {
          title: 'Galería Local',
          desc: 'Administra las fotos que aparecen en tu vitrina digital. Puedes reordenarlas arrastrando desde el icono de las flechas y añadir títulos descriptivos.',
          image: '/manual/galeria.webp'
        },
        {
          title: 'Gestión de Usuarios',
          desc: 'Controla quién tiene acceso al sistema y con qué nivel de permisos (SuperUser, TPV, Contabilidad). Puedes crear nuevos perfiles de staff, resetear contraseñas o dar de baja accesos.',
          image: '/manual/usuarios.webp'
        },
        {
          title: 'Personalización Web',
          desc: 'Permite editar el texto del banner deslizante (Marquee) que aparece en la web pública. Ideal para anunciar promociones del día o mensajes de bienvenida.',
          image: '/manual/personalizacion.webp'
        }
      ],
      features: [
        'Parámetros de Envío: Define precio base, costo por KM y límites GPS.',
        'Gestión de Horarios: Controla la disponibilidad de la web pública por día.',
        'Galería de Imágenes: Sube y recorta fotos para el menú digital.',
        'Gestión de Personal: Administra usuarios, contraseñas y permisos.',
        'Seguridad: Control de accesos y configuración de motor de pagos.'
      ],
      color: '#34495e'
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
