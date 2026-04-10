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
  Info,
  ExternalLink,
  X
} from 'lucide-react';
import './Manual.css';

const Manual = () => {
  const navigate = useNavigate();
  const [selectedDetail, setSelectedDetail] = React.useState(null);

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
      title: 'Pedidos Clientes',
      icon: <ShoppingBag className="section-icon" />,
      description: 'Recepción de pedidos realizados desde la web pública.',
      items: [
        'Streaming SSE: Recibe pedidos al instante.',
        'Notificaciones sonoras y visuales (Toasts).',
        'Filtro por estado (Pendiente, Entregado).',
        'Acceso al ticket digital del cliente.'
      ],
      color: '#ffffff'
    },
    {
      id: 'inventario',
      title: 'Inventario y Stock',
      icon: <Package className="section-icon" />,
      description: 'Control de materia prima y alertas de stock crítico.',
      items: [
        'Alertas automáticas en rojo si baja del mínimo.',
        'Ajuste rápido de cantidades y stock deseado.',
        'Exportación a Excel y PDF para auditoría.'
      ],
      color: '#2ecc71'
    },
    {
      id: 'finanzas',
      title: 'Contabilidad',
      icon: <TrendingUp className="section-icon" />,
      description: 'Control de ingresos, gastos y balance de caja.',
      items: [
        'Balance diario, semanal y mensual.',
        'Registro manual de movimientos (Luz, Alquiler).',
        'Reportes listos para contaduría.'
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
        <div className="manual-modal-overlay" onClick={() => setSelectedDetail(null)}>
          <div className="manual-modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDetail.name || selectedDetail.title}</h2>
              <button className="close-btn" onClick={() => setSelectedDetail(null)}><X size={24} /></button>
            </div>
            <div className="modal-content">
              {selectedDetail.image && (
                <div className="modal-image-box">
                  <img src={selectedDetail.image} alt={selectedDetail.name} />
                  <div className="image-caption">Captura ilustrativa del módulo</div>
                </div>
              )}
              <div className="modal-info">
                <p className="detail-desc">{selectedDetail.desc || selectedDetail.description}</p>
                <h3>Funcionalidades Clave:</h3>
                <ul className="detail-features">
                  {(selectedDetail.features || selectedDetail.items).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                {selectedDetail.url && (
                  <a href={selectedDetail.url} target="_blank" rel="noreferrer" className="jump-to-url">
                    IR A ESTE MÓDULO <ExternalLink size={16} />
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
          <p className="hero-subtitle">Explora el ecosistema de Duke Burger. Haz clic en cualquier ruta para ver detalles.</p>
        </div>
      </header>

      <main className="manual-content">
        <div className="container">
          <section className="urls-section">
            <h2 className="section-title">Mapa de Rutas (Click para ver detalles)</h2>
            <div className="route-map-grid">
              {mainRoutes.map(route => (
                <div key={route.id} className="route-card" onClick={() => setSelectedDetail(route)}>
                  <div className="route-header">
                    <span className="route-badge">URL</span>
                    <code className="url-code">{route.url}</code>
                  </div>
                  <h3>{route.name}</h3>
                  <p>{route.desc}</p>
                  <div className="route-action-hint">Click para ver explicación y captura →</div>
                </div>
              ))}
            </div>
          </section>

          <section className="manual-grid-section">
            <h2 className="section-title">Módulos Complementarios</h2>
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
                  <div className="card-action-hint">Ver más detalles</div>
                </div>
              ))}
            </div>
          </section>

          <section className="setup-section">
            <div className="setup-grid">
              <div className="setup-card">
                <h3><Clock size={24} /> Horarios y Delivery</h3>
                <p>Configura la disponibilidad del local y los costos de envío por kilómetro desde la sección <strong>Configuración</strong>.</p>
                <div className="setup-tip">
                  <strong>💡 Pro Tip:</strong> El sistema redondea automáticamente a $100 para facilitar el cobro en efectivo.
                </div>
              </div>
              <div className="setup-card">
                <h3><Smartphone size={24} /> Web Pública</h3>
                <p>La vitrina donde tus clientes eligen. Sincronizada 100% con tu stock e inventario en tiempo real.</p>
              </div>
              <div className="setup-card">
                <h3><Sparkles size={24} /> Duke Assist</h3>
                <p>Recuerda que puedes preguntarle dudas analíticas directamente al asistente en cualquier momento.</p>
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
