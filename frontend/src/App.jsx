import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoadingScreen from './admin/components/LoadingScreen';
import { isAuthenticated } from './services/api';
import './App.css'; 

// Lazy Loading for all pages
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const PublicTicket = lazy(() => import('./pages/PublicTicket'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard'));
const Products = lazy(() => import('./admin/pages/Products'));
const MenuList = lazy(() => import('./admin/pages/MenuList'));
const Inventory = lazy(() => import('./admin/pages/Inventory'));
const HistoryLog = lazy(() => import('./admin/pages/HistoryLog'));
const Sales = lazy(() => import('./admin/pages/Sales'));
const Orders = lazy(() => import('./admin/pages/Orders'));
const SupplierOrders = lazy(() => import('./admin/pages/SupplierOrders'));
const Accounting = lazy(() => import('./admin/pages/Accounting'));
const Promos = lazy(() => import('./admin/pages/Promos'));
const Settings = lazy(() => import('./admin/pages/Settings'));
const Gallery = lazy(() => import('./admin/pages/Gallery'));
const Login = lazy(() => import('./admin/pages/Login'));
const ResetPassword = lazy(() => import('./admin/pages/ResetPassword'));
const Profile = lazy(() => import('./admin/pages/Profile'));
const Users = lazy(() => import('./admin/pages/Users'));
const Kitchen = lazy(() => import('./admin/pages/Kitchen'));
const Manual = lazy(() => import('./pages/Manual'));

const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    // Store the intended path to redirect back after login
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      sessionStorage.setItem('duke_redirect_after_login', window.location.pathname);
    }
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <BrowserRouter>
        <Routes>
          {/* Consumer Site */}
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/ticket/:id" element={<PublicTicket />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/manual" element={<Manual />} />
          <Route element={<ProtectedRoute />}>
             <Route path="/cocina" element={<Kitchen />} />
             <Route path="/tpv" element={<Sales />} />
          </Route>

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
              <Route path="galeria" element={<Gallery />} />
              <Route path="historial" element={<HistoryLog />} />
              <Route path="config" element={<Settings />} />
              <Route path="usuarios" element={<Users />} />
              <Route path="perfil" element={<Profile />} />
              <Route path="cocina" element={<Kitchen />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;
