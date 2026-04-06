import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import Toast from './components/Toast';
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  Boxes,
  History,
  TrendingUp,
  Truck,
  Menu,
  X,
  ShoppingCart,
  Star,
  Image as ImageIcon,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';
import './Admin.css';

import UserDropdown from './components/UserDropdown';

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const esRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const connectSSE = () => {
      const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://api.dukeburger-sj.com';
      const es = new EventSource(`${apiUrl}/api/orders-stream/`);
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_order') {
            setNotification({
              message: `🍔 ¡NUEVO PEDIDO! de ${data.customer} ($${data.total})`,
              type: 'success'
            });
            // Dispatch event for sub-pages (Dashboard, TPV) to refresh
            window.dispatchEvent(new CustomEvent('new-order-received', { detail: data }));
          }
        } catch (e) { console.error("SSE parse error", e); }
      };

      es.onerror = () => {
        es.close();
        setTimeout(connectSSE, 10000); // Retry after 10s
      };
    };

    connectSSE();
    return () => { if (esRef.current) esRef.current.close(); };
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Configuración', path: '/admin/config', icon: <SettingsIcon size={20} /> },
    { name: 'TPV', path: '/admin/tpv', icon: <ShoppingCart size={20} /> },
    { name: 'Pedidos Clientes', path: '/admin/pedidos-clientes', icon: <TrendingUp size={20} /> },
    { name: 'Productos', path: '/admin/productos', icon: <Package size={20} /> },
    { name: 'Carta', path: '/admin/carta', icon: <UtensilsCrossed size={20} /> },
    { name: 'Promos', path: '/admin/promos', icon: <Star size={20} fill="#fcc419" color="#fcc419" /> },
    { name: 'Inventario', path: '/admin/inventario', icon: <Boxes size={20} /> },
    { name: 'Pedidos Proveedor', path: '/admin/pedidos', icon: <Truck size={20} /> },
    { name: 'Contabilidad', path: '/admin/contabilidad', icon: <TrendingUp size={20} /> },
    { name: 'Galería Local', path: '/admin/galeria', icon: <ImageIcon size={20} /> },
    { name: 'Historial', path: '/admin/historial', icon: <History size={20} /> },
  ];

  return (
    <div className="admin-container">
      {/* Overlay to close sidebar on mobile when clicking outside */}
      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>}
      
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" title="Ir a la Web principal">
            <img src="/brand/duke burger 1 negativo.png" alt="Duke Admin Logo" style={{ height: '80px', objectFit: 'contain', cursor: 'pointer' }} />
          </Link>
          <button className="close-sidebar-btn" onClick={() => setIsMobileOpen(false)}>
            <X size={24} color="#fff" />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              onClick={() => setIsMobileOpen(false)}
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      
      <main className="admin-main">
        <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="admin-mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <Menu size={24} />
            </button>
            <h3 style={{ margin: 0 }}>Panel de Control</h3>
          </div>
          
          <UserDropdown />
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default AdminLayout;
