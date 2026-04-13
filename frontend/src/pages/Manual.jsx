import React, { useState } from 'react';
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
  Smartphone,
  X,
  PlusCircle,
  AlertTriangle,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Truck,
  ClipboardList,
  Layers,
  PlayCircle
} from 'lucide-react';
import './Manual.css';

const Manual = () => {
  const navigate = useNavigate();
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

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
      ]
    },
    { 
      id: 'tpv',
      name: 'TPV (Punto de Venta)', 
      role: 'PARA: CAJEROS / ATENCIÓN',
      url: 'https://dukeburger-sj.com/admin/tpv', 
      desc: 'Interfaz táctil para cobros rápidos, gestión de pedidos físicos y control de tickets pendientes.',
      image: '/manual/tpv.webp',
      features: [
        'Carrito Lateral: Los productos elegidos aparecen a la derecha.',
        'Icono Regalo/Cortesía: Ajuste de precio a $0.',
        'Botón Cobrar: Finaliza la venta y genera el registro.',
        'Tickets Pendientes: Listado inferior de mesas/cuentas abiertas.'
      ]
    },
    { 
      id: 'cocina',
      name: 'Monitor de Cocina', 
      role: 'PARA: EQUIPO DE COCINA',
      url: 'https://dukeburger-sj.com/admin/cocina', 
      desc: 'Pantalla dedicada para organizar la producción por orden de llegada y avisar al TPV cuando el pedido está listo.',
      image: '/manual/kitchen.webp',
      features: [
        'Estado "En Cocción": Inicio de preparación.',
        'Estado "Listo": Aviso visual al cajero para entrega.',
        'Tiempo de Espera: Indicador de retraso por pedido.',
        'Filtro de Pedidos: Limpieza de pantalla tras entrega.'
      ]
    }
  ];

  const modules = [
    {
      id: 'carta',
      title: 'Menú Online',
      icon: <LayoutDashboard className="section-icon" />,
      description: 'Gestiona los productos visibles en la web y sincroniza precios con el TPV.',
      color: '#e67e22'
    },
    {
      id: 'pedidos',
      title: 'Gestión de Pedidos',
      icon: <ShoppingBag className="section-icon" />,
      description: 'Historial completo de ventas online y físicas con herramientas de exportación.',
      color: '#ffffff'
    },
    {
      id: 'inventario',
      title: 'Almacén de Insumos',
      icon: <Package className="section-icon" />,
      description: 'Control de stock, alertas de mínimo y ajuste de materia prima.',
      color: '#2ecc71'
    },
    {
      id: 'finanzas',
      title: 'Contabilidad Duke',
      icon: <TrendingUp className="section-icon" />,
      description: 'Balance neto, registro de gastos operativos e ingresos manuales.',
      color: '#9b59b6'
    },
    {
      id: 'asistente',
      title: 'Duke Assist (IA)',
      icon: <Sparkles className="section-icon" />,
      description: 'IA entrenada con tus ventas para responder dudas operativas y financieras.',
      color: '#e31b23'
    }
  ];

  const productWorkflowSteps = [
    {
      title: '1. Inventariado de Almacén',
      desc: 'Creación de insumos base (ej: Cajas de queso, 40u). Define packs y stock inicial.',
      icon: <Package size={24} />,
      color: '#2ecc71'
    },
    {
      title: '2. Definición de Recetas',
      desc: 'Asocia insumos a tus productos. (ej: Burger Duke = 2u queso + 0.3kg carne).',
      icon: <ClipboardList size={24} />,
      color: '#3498db'
    },
    {
      title: '3. Publicación en Carta',
      desc: 'Activa el producto en la web, asigna precio y categoría.',
      icon: <LayoutDashboard size={24} />,
      color: '#e67e22'
    },
    {
      title: '4. Recepción de Pedido',
      desc: 'El pedido entra a Cocina ("En Cocción") y al TPV como pendiente.',
      icon: <Smartphone size={24} />,
      color: '#e74c3c'
    },
    {
      title: '5. Cocción y Despacho',
      desc: 'Al terminar, Cocina marca "Listo". Tras retiro, se marca "Recogido".',
      icon: <ChefHat size={24} />,
      color: '#27ae60'
    },
    {
      title: '6. Deducción Automática',
      desc: 'Al cobrar en TPV, el sistema descuenta la materia prima del inventario.',
      icon: <TrendingUp size={24} />,
      color: '#9b59b6'
    },
    {
      title: '7. Reposición de Stock',
      desc: 'Registra compras al proveedor. El stock se suma automáticamente al confirmar.',
      icon: <Truck size={24} />,
      color: '#16a085'
    },
    {
      title: '8. Auditoría y Gastos',
      desc: 'Consulta ventas en "Pedidos" y gastos en "Contabilidad" para el balance total.',
      icon: <TrendingUp size={24} />,
      color: '#2c3e50'
    }
  ];

  const faqs = [
    { 
      q: '¿Cómo gestiono los permisos?', 
      a: 'Configuración > Personal para asignar niveles de acceso (TPV, Cocina, Admin).'
    },
    { 
      q: '¿Cómo se calcula el envío?', 
      a: 'Basado en GPS: [Base] + [KM * Precio KM]. Redondeo cada $100.'
    }
  ];

  return (
    <div className="manual-page">
      <Helmet>
        <title>Manual de Usuario | Duke Burger</title>
      </Helmet>

      {/* Modal de Vida del Producto (Workflow) */}
      {isWorkflowOpen && (
        <div className="manual-modal-overlay fullscreen workflow-modal" onClick={() => setIsWorkflowOpen(false)}>
          <div className="manual-modal-container fullscreen" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <PlayCircle className="workflow-title-icon" />
                <h2>Flujo de Trabajo: Vida del Producto</h2>
              </div>
              <button className="close-btn" onClick={() => setIsWorkflowOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-content workflow-view-content">
              <div className="workflow-timeline large">
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
            </div>
          </div>
        </div>
      )}

      {/* Detalle de Ruta / Módulo */}
      {selectedDetail && (
        <div className="manual-modal-overlay fullscreen" onClick={() => setSelectedDetail(null)}>
          <div className="manual-modal-container fullscreen" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {selectedDetail.icon || <Layers />}
                <h2>{selectedDetail.name || selectedDetail.title}</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedDetail(null)}><X size={24} /></button>
            </div>
            <div className="modal-content">
              {selectedDetail.image && (
                <div className="modal-image-box">
                  <img src={selectedDetail.image} alt="Vista" />
                </div>
              )}
              <div className="modal-info">
                <p className="detail-desc">{selectedDetail.desc || selectedDetail.description}</p>
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
          <p className="hero-subtitle">Documentación oficial para el equipo de Duke Burger</p>
          
          <button className="workflow-hero-btn" onClick={() => setIsWorkflowOpen(true)}>
            <PlayCircle size={22} />
            <span>VIDA DEL PRODUCTO (FLUJO COMPLETO)</span>
          </button>
        </div>
      </header>

      <main className="manual-content">
        <div className="container">
          
          <section className="manual-grid-section">
            <h2 className="section-title">Canales Principales</h2>
            <div className="manual-grid">
              {mainRoutes.map(route => (
                <div key={route.id} className="manual-card route-card" onClick={() => setSelectedDetail(route)}>
                  <div className="card-header">
                    <span className="route-badge">{route.id.toUpperCase()}</span>
                    <h3>{route.name}</h3>
                  </div>
                  <p className="card-desc">{route.desc}</p>
                  <span className="card-action-hint">VER GUÍA DETALLADA</span>
                </div>
              ))}
            </div>
          </section>

          <section className="manual-grid-section">
            <h2 className="section-title">Módulos Administrativos</h2>
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

          <section className="faq-section">
            <h2 className="section-title">Preguntas Frecuentes</h2>
            <div className="faq-column">
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <h3>{faq.q}</h3>
                  <p>{faq.a}</p>
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
