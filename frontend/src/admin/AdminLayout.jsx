import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { logout, fetchMe } from '../services/api';
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
  Users as UsersIcon,
  LogOut,
  Mail,
  Utensils
} from 'lucide-react';
import './Admin.css';

import UserDropdown from './components/UserDropdown';
import AIChat from './components/AIChat';

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sseStatus, setSseStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const esRef = useRef(null);
  const reconnectDelay = useRef(5000); // Backoff exponencial
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchMe();
        setProfile(data);
        
        // Strict redirection for kitchen-only users
        // If user has kitchen perm but NOT superuser, NOT manager and NO other admin perms
        const p = data.profile;
        if (p?.can_use_kitchen && !data.is_superuser && !p?.is_admin_manager && 
            !p?.can_use_tpv && !p?.can_use_accounting && !p?.can_use_menu && 
            !p?.can_use_inventory && !p?.can_use_settings) {
            
            console.log("Access restricted: Redirecting to Kitchen view");
            navigate('/cocina');
        }
      } catch (e) { console.error("Profile load error", e); }
    };
    loadProfile();

    const connectSSE = () => {
      setSseStatus('connecting');
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const token = sessionStorage.getItem('duke_admin_token');
      if (!token) {
        setSseStatus('error');
        setTimeout(connectSSE, 10000);
        return;
      }

      // Robust URL building
      let baseUrl = import.meta.env.VITE_API_URL || 'https://api.dukeburger-sj.com';
      baseUrl = baseUrl.replace(/\/$/, "");
      if (!baseUrl.toLowerCase().endsWith('/api')) {
        baseUrl += '/api';
      }

      const sseUrl = `${baseUrl}/orders-stream/?token=${token.trim()}`;
      console.log("SSE: Initializing connection to", sseUrl);
      const es = new EventSource(sseUrl, { withCredentials: true });
      esRef.current = es;

      es.onopen = () => {
        setSseStatus('connected');
        reconnectDelay.current = 5000; // Reset al reconectar bien
        
        if (import.meta.env.DEV) {
          setNotification({ message: "Conexión en tiempo real activa", type: 'success' });
        }
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_order') {
            setNotification({
              message: `🍔 ¡NUEVO PEDIDO! de ${data.customer} ($${data.total})`,
              type: 'success'
            });
            window.dispatchEvent(new CustomEvent('new-order-received', { detail: data }));
          }
          
          if (data.type === 'order_updated') {
            // Siempre avisar a los componentes (para refresco silencioso)
            window.dispatchEvent(new CustomEvent('new-order-received', { detail: data }));

            // No notificar visualmente (Toast) si el pedido ya está cobrado/completado
            if (data.status === 'COMPLETED') return;

            if (!data.is_prepared && !data.is_delivered) {
                setNotification({
                    message: `⚠️ PEDIDO #${data.id} HA SIDO MODIFICADO`,
                    type: 'info'
                });
            }
            // Notificar solo si pasa a LISTO y no está ya entregado/cobrado
            if (data.is_prepared && !data.is_delivered) {
                setNotification({
                    message: `✅ PEDIDO #${data.id} LISTO EN COCINA`,
                    type: 'success'
                });
            }
          }
        } catch (e) {
          // Silent for heatbeats
        }
      };

      es.onerror = (err) => {
        setSseStatus('error');
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
        // Espera más tiempo en cada reintento (máx 30s)
        setTimeout(connectSSE, reconnectDelay.current);
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
      };
    };

    connectSSE();
    return () => { if (esRef.current) esRef.current.close(); };
  }, []);

  const allMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, public: true },
    { name: 'TPV', path: '/admin/tpv', icon: <ShoppingCart size={20} />, perm: 'can_use_tpv' },
    { name: 'Cocina', path: '/admin/cocina', icon: <Utensils size={20} />, perm: 'can_use_kitchen' },
    
    { type: 'separator' },
    
    { name: '1. Inventario', path: '/admin/inventario', icon: <Boxes size={20} />, perm: 'can_use_inventory' },
    { name: '2. Productos', path: '/admin/productos', icon: <Package size={20} />, perm: 'can_use_menu' },
    { name: '3. Carta', path: '/admin/carta', icon: <UtensilsCrossed size={20} />, perm: 'can_use_menu' },
    { name: '4. Promos', path: '/admin/promos', icon: <Star size={20} fill="#fcc419" color="#fcc419" />, perm: 'can_use_promos' },
    
    { type: 'separator' },
    
    { name: 'Pedidos al Proveedor', path: '/admin/pedidos', icon: <Truck size={20} />, perm: 'can_use_inventory' },
    { name: 'Contabilidad', path: '/admin/contabilidad', icon: <TrendingUp size={20} />, perm: 'can_use_accounting' },
    { name: 'Pedidos Clientes', path: '/admin/pedidos-clientes', icon: <TrendingUp size={20} />, perm: 'can_use_tpv' },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.type === 'separator') return true;
    if (item.public || !profile) return true;
    if (profile.is_superuser) return true;
    return profile.profile?.[item.perm];
  });

  return (
    <div className="admin-container">
      {/* Overlay to close sidebar on mobile when clicking outside */}
      <div className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`} onClick={() => setIsMobileOpen(false)}></div>

      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" target="_blank" rel="noopener noreferrer" title="Ir a la Web principal (Nueva pestaña)" onClick={() => setIsMobileOpen(false)} style={{ position: 'relative', cursor: 'pointer' }}>
            <img src="/brand/duke burger 1 negativo.png" alt="Duke Admin Logo" style={{ height: '60px', objectFit: 'contain', cursor: 'pointer' }} />
            {/* SSE Status Indicator */}
            <div
              title={sseStatus === 'connected' ? "En tiempo real activo" : sseStatus === 'connecting' ? "Conectando..." : "Error de conexión"}
              style={{
                position: 'absolute', top: '5px', right: '-12px', width: '10px', height: '10px',
                borderRadius: '50%',
                background: sseStatus === 'connected' ? '#40c057' : sseStatus === 'connecting' ? '#fab005' : '#f03e3e',
                boxShadow: `0 0 10px ${sseStatus === 'connected' ? 'rgba(64,192,87,0.5)' : sseStatus === 'connecting' ? 'rgba(250,176,5,0.5)' : 'rgba(240,62,62,0.5)'}`,
                transition: 'all 0.3s ease'
              }}
            />
          </Link>
          <button className="close-sidebar-btn" onClick={() => setIsMobileOpen(false)}>
            <X size={24} color="#fff" />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => {
            if (item.type === 'separator') {
              return <div key={`sep-${idx}`} className="sidebar-separator" style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '15px 10px' }} />;
            }
            return (
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
            );
          })}

          {(profile?.is_superuser || profile?.profile?.can_use_webmail) && (
            <a
              href="https://webmail.dondominio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item"
              style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}
            >
              <Mail size={20} color="#fcc419" />
              <span style={{ color: '#fff' }}>WEBMAIL</span>
            </a>
          )}
          
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="admin-mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <Menu size={24} />
            </button>
            <Link to="/admin" className="admin-panel-link" style={{ textDecoration: 'none', color: '#fff' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '1px' }}>DUKE BURGER PANEL</h3>
            </Link>
          </div>

          <div style={{ margin: '4px 4px 4px 0' }}>
            <UserDropdown />
          </div>
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

      {/* AI Assistant Chat */}
      <AIChat />

    </div>
  );
};

export default AdminLayout;
