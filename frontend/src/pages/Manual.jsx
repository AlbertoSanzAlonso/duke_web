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
        { title: 'Pedidos de Hoy', desc: 'Resumen cuantitativo de ventas del día, diferenciando tickets cobrados de pendientes.', icon: <ShoppingBag size={18} /> },
        { title: 'Estado Cocina', desc: 'Vista rápida de la carga de trabajo en cocina (Listos vs En Cocción).', icon: <ChefHat size={18} /> },
        { title: 'Alertas de Stock', desc: 'Indicador crítico de insumos agotados o por debajo del mínimo de seguridad.', icon: <AlertTriangle size={18} /> },
        { title: 'Correo Corporativo', desc: 'Bandeja de entrada para consultas directas desde el formulario web.', icon: <Mail size={18} /> },
        { title: 'Auditoría', desc: 'Historial detallado de cada acción realizada en el sistema (quién, qué y cuándo).', icon: <ClipboardList size={18} /> },
        { title: 'Sistema', desc: 'Acceso directo a la configuración global (Horarios, Precios Delivery, GPS).', icon: <Settings size={18} /> }
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

  return (
    <div className="manual-page">
      <Helmet>
        <title>Manual de Usuario | Duke Burger Admin</title>
      </Helmet>

      {selectedDetail && (
        <div className="manual-modal-overlay fullscreen" onClick={() => { setSelectedDetail(null); setIsZoomed(false); }}>
          <div className="manual-modal-container fullscreen" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {selectedDetail.icon || <LayoutDashboard size={24} />}
                <h2>{selectedDetail.name || selectedDetail.title}</h2>
              </div>
              <button className="close-btn" onClick={() => { setSelectedDetail(null); setIsZoomed(false); }}><X size={24} /></button>
            </div>
            <div className="modal-content">
              {selectedDetail.image && (
                <div className="modal-image-box">
                  <div className={`image-wrapper ${isZoomed ? 'zoomed' : ''}`} onClick={() => setIsZoomed(!isZoomed)}>
                    <img src={selectedDetail.image} alt={selectedDetail.name} />
                    <div className="zoom-hint"><Maximize2 size={20} /> Click para ampliar captura</div>
                  </div>
                  <div className="image-caption">Captura real del sistema en funcionamiento</div>
                </div>
              )}
              <div className="modal-info">
                <p className="detail-desc">{selectedDetail.desc || selectedDetail.description}</p>
                
                {selectedDetail.dashboardElements && (
                  <div className="dashboard-structure">
                    <h3>Estructura del Panel:</h3>
                    <div className="element-grid">
                      {selectedDetail.dashboardElements.map((el, i) => (
                        <div key={i} className="element-item">
                          <div className="el-header">
                            {el.icon}
                            <strong>{el.title}</strong>
                          </div>
                          <p>{el.desc}</p>
                        </div>
                      ))}
                    </div>
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
