import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import Products from './admin/pages/Products';
import MenuList from './admin/pages/MenuList';
import Inventory from './admin/pages/Inventory';
import HistoryLog from './admin/pages/HistoryLog';
import Sales from './admin/pages/Sales';
import Orders from './admin/pages/Orders';
import SupplierOrders from './admin/pages/SupplierOrders';
import './App.css'; // Global styles for consumer site

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Consumer Site */}
        <Route path="/" element={<Home />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<Products />} />
          <Route path="carta" element={<MenuList />} />
          <Route path="inventario" element={<Inventory />} />
          <Route path="pedidos-clientes" element={<Orders />} />
          <Route path="tpv" element={<Sales />} />
          <Route path="pedidos" element={<SupplierOrders />} />
          <Route path="historial" element={<HistoryLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
