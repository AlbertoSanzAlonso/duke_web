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
  Settings
} from 'lucide-react';
import './Manual.css';

const Manual = () => {
  const navigate = useNavigate();
  const [selectedDetail, setSelectedDetail] = React.useState(null);
  const [isZoomed, setIsZoomed] = React.useState(false);

  const mainRoutes = [
    { 
      id: 'admin',
      name: 'Panel de Administración', 
      url: 'https://dukeburger-sj.com/admin', 
      desc: 'Centro de control interno para gestión de stock, finanzas y configuración.',
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
      url: 'https://dukeburger-sj.com/tpv', 
      desc: 'Terminal táctil para cobro rápido en mostrador y gestión de pedidos locales.',
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
      url: 'https://dukeburger-sj.com/cocina', 
      desc: 'Pantalla operativa para el equipo de producción.',
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
    { q: '¿Cómo cambio el horario?', a: 'Ve a Configuración > Horarios. Allí verás una tabla con los días de la semana donde puedes ajustar la franja de atención y marcar el estado como Abierto o Cerrado.' },
    { q: '¿Cómo cambio las promos?', a: 'Accede al módulo de Promociones desde el Panel. Puedes crear nuevas promos, elegir en qué días se publican y subir una imagen dedicada para cada una.' },
    { q: '¿Cómo cambio las imágenes de la galería?', a: 'Dentro de Configuración > Galería, puedes subir nuevas fotos del local. Usa el icono de las flechas para reordenarlas según cómo quieras que aparezcan en la web.' },
    { q: '¿Cómo añado/quito/modifico artículos?', a: 'Para insumos de cocina y stock, usa el módulo de Inventario. Para productos definitivos del menú, usa el módulo de Productos.' },
    { q: '¿Cómo creo un nuevo usuario?', a: 'En Configuración > Personal puedes dar de alta a nuevos miembros del equipo y asignarles permisos específicos (ej. solo Cocina o solo Contabilidad).' },
    { q: '¿Cómo manejo tickets?', a: 'Usa el TPV para generar nuevas ventas. Los tickets pendientes aparecerán en la lista lateral para ser cobrados o editados en cualquier momento.' },
    { q: '¿Cómo manejo pedidos al proveedor?', a: 'En Inventario > Pedidos Proveedor puedes registrar las compras realizadas. Al completar un pedido, el stock de esos insumos se incrementará automáticamente.' },
    { q: '¿Cómo manejo pedidos de clientes?', a: 'Todos los pedidos que entran por la web aparecen en Gestión de Pedidos. Desde allí puedes ver el ticket, imprimirlo y cambiar su estado.' },
    { q: '¿Cómo funciona la carta?', a: 'En el módulo Menú Online puedes activar o desactivar productos que ya están en tu catálogo (Productos) y asignarles el precio de venta final.' }
  ];

  return (
    <div className="manual-page">
      <Helmet>
        <title>Manual de Usuario | Duke Burger Admin</title>
      </Helmet>

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
                    <span className="route-badge">CONEXIÓN DIRECTA</span>
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
            <div className="faq-grid">
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <h3>{faq.q}</h3>
                  <p>{faq.a}</p>
                </div>
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
