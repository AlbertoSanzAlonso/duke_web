import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import PublicTicket from './pages/PublicTicket';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import Products from './admin/pages/Products';
import MenuList from './admin/pages/MenuList';
import Inventory from './admin/pages/Inventory';
import HistoryLog from './admin/pages/HistoryLog';
import Sales from './admin/pages/Sales';
import Orders from './admin/pages/Orders';
import SupplierOrders from './admin/pages/SupplierOrders';
import Accounting from './admin/pages/Accounting';
import Promos from './admin/pages/Promos';
import Settings from './admin/pages/Settings';
import Login from './admin/pages/Login';
import { isAuthenticated } from './services/api';
import { Navigate, Outlet } from 'react-router-dom';
import './App.css'; // Global styles for consumer site

const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Consumer Site */}
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<About />} />
        <Route path="/ticket/:id" element={<PublicTicket />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<Products />} />
            <Route path="carta" element={<MenuList />} />
            <Route path="promos" element={<Promos />} />
            <Route path="inventario" element={<Inventory />} />
            <Route path="pedidos-clientes" element={<Orders />} />
            <Route path="tpv" element={<Sales />} />
            <Route path="pedidos" element={<SupplierOrders />} />
            <Route path="contabilidad" element={<Accounting />} />
            <Route path="historial" element={<HistoryLog />} />
            <Route path="config" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
