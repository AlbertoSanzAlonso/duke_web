import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  Boxes,
  History,
  TrendingUp,
  Truck
} from 'lucide-react';
import './Admin.css';

const AdminLayout = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Productos', path: '/admin/productos', icon: <Package size={20} /> },
    { name: 'Carta', path: '/admin/carta', icon: <UtensilsCrossed size={20} /> },
    { name: 'Inventario', path: '/admin/inventario', icon: <Boxes size={20} /> },
    { name: 'Ventas', path: '/admin/ventas', icon: <TrendingUp size={20} /> },
    { name: 'Pedidos al proveedor', path: '/admin/pedidos', icon: <Truck size={20} /> },
    { name: 'Historial', path: '/admin/historial', icon: <History size={20} /> },
  ];

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Duke Admin</h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
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
