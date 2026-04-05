import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
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
  Star
} from 'lucide-react';
import './Admin.css';

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'TPV', path: '/admin/tpv', icon: <ShoppingCart size={20} /> },
    { name: 'Pedidos Clientes', path: '/admin/pedidos-clientes', icon: <TrendingUp size={20} /> },
    { name: 'Productos', path: '/admin/productos', icon: <Package size={20} /> },
    { name: 'Carta', path: '/admin/carta', icon: <UtensilsCrossed size={20} /> },
    { name: 'Promos', path: '/admin/promos', icon: <Star size={20} fill="#fcc419" color="#fcc419" /> },
    { name: 'Inventario', path: '/admin/inventario', icon: <Boxes size={20} /> },
    { name: 'Pedidos Proveedor', path: '/admin/pedidos', icon: <Truck size={20} /> },
    { name: 'Contabilidad', path: '/admin/contabilidad', icon: <TrendingUp size={20} /> },
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
        <header className="admin-header">
          <button className="admin-mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
            <Menu size={24} />
          </button>
          <h3>Panel de Control</h3>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
