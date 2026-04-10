import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Terminal, 
  ChefHat, 
  ShoppingBag, 
  Package, 
  Truck, 
  UtensilsCrossed, 
  TrendingUp, 
  Settings, 
  Users, 
  Sparkles, 
  LayoutDashboard,
  Clock,
  MapPin,
  Smartphone,
  Info
} from 'lucide-react';
import './Manual.css';

const Manual = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'tpv',
      title: 'TPV (Punto de Venta)',
      icon: <Terminal className="section-icon" />,
      description: 'Herramienta para ventas en mostrador y pedidos locales.',
      items: [
        'Búsqueda rápida de productos por nombre.',
        'Selector de entrega: Mesa, Llevar o Delivery.',
        'Cálculo automático de envíos por KM (San Juan).',
        'Generación de tickets digitales inalterables.',
        'Gestión de tickets pendientes de cobro.'
      ],
      color: '#e31b23'
    },
    {
      id: 'cocina',
      title: 'Monitor de Cocina',
      icon: <ChefHat className="section-icon" />,
      description: 'Gestión en tiempo real de la producción de platos.',
      items: [
        'Pedidos entrantes automáticos sin recargar.',
        'Estados: En Cocción, Listo y Recogido.',
        'Sincronización automática con el TPV.',
        'Priorización visual por tiempo de espera.',
        'Acceso directo desde el Dashboard o TPV.'
      ],
      color: '#ff4d4d'
    },
    {
      id: 'pedidos',
      title: 'Pedidos Clientes',
      icon: <ShoppingBag className="section-icon" />,
      description: 'Recepción de pedidos realizados desde la web pública.',
      items: [
        'Streaming SSE: Recibe pedidos al instante.',
        'Notificaciones sonoras y visuales (Toasts).',
        'Filtro por estado (Pendiente, Entregado).',
        'Acceso al ticket digital del cliente.',
        'Indicador de salud de conexión en el sidebar.'
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
        'Exportación a Excel y PDF para auditoría.',
        'Categorización por tipo de insumo.',
        'Formulario de creación rápida de items.'
      ],
      color: '#2ecc71'
    },
    {
      id: 'proveedores',
      title: 'Pedidos Proveedor',
      icon: <Truck className="section-icon" />,
      description: 'Gestión de compras y carga automática de stock.',
      items: [
        'Registro de compras por proveedor.',
        'Suma automática al Inventario al completar.',
        'Posibilidad de crear nuevos items sobre la marcha.',
        'Historial de costos de insumos.',
        'Control de deudas o pagos pendientes.'
      ],
      color: '#3498db'
    },
     {
      id: 'carta',
      title: 'Carta y Productos',
      icon: <UtensilsCrossed className="section-icon" />,
      description: 'Configuración visual de lo que ve el cliente.',
      items: [
        'Gestión de base de datos de productos (Recetas).',
        'Precios por categoría para la web.',
        'Recorte de imágenes inteligente (Crop).',
        'Promociones programadas por día de la semana.',
        'Galería de fotos para el carrusel principal.'
      ],
      color: '#f1c40f'
    },
    {
      id: 'finanzas',
      title: 'Contabilidad',
      icon: <TrendingUp className="section-icon" />,
      description: 'Control de ingresos, gastos y balance de caja.',
      items: [
        'Balance diario, semanal y mensual.',
        'Registro manual de movimientos (Luz, Alquiler).',
        'Históricos comparativos de los últimos 6 meses.',
        'Filtros avanzados por fecha y tipo.',
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
        'Analiza qué productos rinden mejor.',
        'Identifica quién realizó cambios (Auditoría).',
        'Calcula balances y tendencias financieras.',
        'Siempre disponible en el botón flotante.'
      ],
      color: '#e31b23'
    }
  ];

  const commonUrls = [
    { url: '/', desc: 'Página pública para clientes.' },
    { url: '/login', desc: 'Acceso para el staff.' },
    { url: '/admin', desc: 'Dashboard principal.' },
    { url: '/tpv', desc: 'Acceso directo a ventas (Staff).' },
    { url: '/cocina', desc: 'Monitor de cocina (Operativo).' },
    { url: '/admin/inventario', desc: 'Control de stock.' },
    { url: '/admin/config', desc: 'Horarios y Delivery.' },
    { url: '/ticket/:id', desc: 'Ticket digital (Público).' }
  ];

  return (
    <div className="manual-page">
      <Helmet>
        <title>Manual de Usuario | Duke Burger Admin</title>
        <meta name="description" content="Guía completa del sistema de gestión de Duke Burger." />
      </Helmet>

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
          <p className="hero-subtitle">Explora las herramientas de gestión de Duke Burger.</p>
        </div>
      </header>

      <main className="manual-content">
        <div className="container">
          <section className="manual-grid-section">
            <h2 className="section-title">Módulos del Sistema</h2>
            <div className="manual-grid">
              {sections.map(section => (
                <div key={section.id} className="manual-card" style={{"--accent": section.color}}>
                  <div className="card-header">
                    <div className="icon-wrapper">
                      {section.icon}
                    </div>
                    <h3>{section.title}</h3>
                  </div>
                  <p className="card-desc">{section.description}</p>
                  <ul className="card-list">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
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
                  <strong>💡 Pro Tip:</strong> El sistema redondea automáticamente a $100 para facilitar el cambio.
                </div>
              </div>
              <div className="setup-card">
                <h3><Smartphone size={24} /> Web Pública</h3>
                <p>Los clientes pueden pedir directamente. El sistema de streaming te avisará con un sonido cada vez que ingrese un pedido nuevo.</p>
                <div className="setup-tip">
                  <strong>⚠️ IMPORTANTE:</strong> Mantén siempre abierta la pestaña de Pedidos Clientes.
                </div>
              </div>
              <div className="setup-card">
                <h3><Info size={24} /> Permisos y Roles</h3>
                <p>El administrador puede crear nuevos usuarios y gestionar sus perfiles desde <strong>Usuarios</strong>. Cada acción queda grabada en el historial.</p>
              </div>
            </div>
          </section>

          <section className="urls-section">
            <h2 className="section-title">Mapa de Rutas (URLs)</h2>
            <div className="urls-table-wrapper">
              <table className="urls-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Funcionalidad / Objetivo</th>
                  </tr>
                </thead>
                <tbody>
                  {commonUrls.map((item, i) => (
                    <tr key={i}>
                      <td><code className="url-code">{item.url}</code></td>
                      <td>{item.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="assist-highlight">
            <div className="assist-content">
              <Sparkles className="assist-glow-icon" size={48} />
              <h2>¿Dudas? Pregúntale a Duke Assist</h2>
              <p>El asistente inteligente conoce este manual y el estado actual de tu negocio. Haz clic en el botón flotante en la esquina inferior derecha para empezar a chatear.</p>
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
