import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSales, fetchMenuEntries, fetchOpeningHours, fetchInventory, fetchMe } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import { ShoppingBag, Star, Clock, AlertTriangle, TrendingUp, Package, CalendarOff, Mail, History, Settings as SettingsIcon } from 'lucide-react';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        todaySalesCount: 0,
        pendingToday: 0,
        completedToday: 0,
        activePromos: 0,
        todayHours: null,
        lowStockItems: []
    });
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const [sales, menu, hours, inventory, profileData] = await Promise.all([
                    fetchSales(),
                    fetchMenuEntries(),
                    fetchOpeningHours(),
                    fetchInventory(),
                    fetchMe()
                ]);

                setProfile(profileData);

                // 1. Sales today (Local Time)
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todaysSales = sales.filter(s => new Date(s.date) >= todayStart);
                const pendingToday = todaysSales.filter(s => s.status === 'PENDING').length;
                const completedToday = todaysSales.filter(s => s.status === 'COMPLETED').length;
                
                // 2. Active Promos
                const activePromos = menu.filter(e => e.category === 'Promos' && e.is_available).length;

                // 3. Today's Hours
                const now = new Date();
                const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                const dayMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
                const dbDay = dayMap[dayOfWeek];
                const todayHours = hours.find(h => h.day === dbDay);

                // 4. Low Stock
                const lowStock = inventory.filter(item => parseFloat(item.quantity) <= parseFloat(item.min_stock));

                setData({
                    todaySalesCount: todaysSales.length,
                    pendingToday,
                    completedToday,
                    activePromos,
                    todayHours,
                    lowStockItems: lowStock
                });

            } catch (err) {
                console.error("Error loading dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading) return <LoadingScreen />;

    return (
        <div className="dash-container">
            <div className="dash-header">
                <h1 className="dash-title">
                    DUKE <span style={{ color: 'var(--admin-primary)' }}>INSIGHTS</span>
                </h1>
                <p className="dash-subtitle">Estado operativo de la sucursal en tiempo real</p>
            </div>

            <div className="dash-grid">
                {/* 1. PEDIDOS HOY */}
                <Link to="/admin/pedidos-clientes?filter=today" className="stat-card" style={{ textDecoration: 'none' }}>
                    <div className="stat-icon-box icon-red">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{data.todaySalesCount}</div>
                        <div className="stat-label">Pedidos de Hoy</div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                            <span style={{ color: '#f08c00', fontWeight: 'bold' }}>{data.pendingToday} pendientes</span> / <span style={{ color: '#2b8a3e', fontWeight: 'bold' }}>{data.completedToday} cobrados</span>
                        </div>
                    </div>
                </Link>

                {/* 2. PROMOS ACTIVAS */}
                <div className="stat-card" style={{ flexDirection: 'column', textAlign: 'center' }}>
                    <div className="stat-icon-box icon-orange" style={{ margin: '0 auto 10px' }}>
                        <Star size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Promos en Cartelera</div>
                        <div className="stat-value" style={{ fontSize: '1.8rem' }}>{data.activePromos}</div>
                    </div>
                </div>

                {/* 3. HORARIO HOY */}
                <div className="stat-card">
                    <div className="stat-icon-box icon-purple">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Horario de Hoy</div>
                        <div className="stat-value">
                            {data.todayHours?.is_open 
                                ? `${data.todayHours.opening_time.slice(0,5)} - ${data.todayHours.closing_time.slice(0,5)}` 
                                : 'CERRADO'}
                        </div>
                    </div>
                </div>

                {/* 4. STOCK CRÍTICO */}
                <div className={`stat-card ${data.lowStockItems.length > 0 ? 'critical-border' : ''}`} style={{ borderLeft: data.lowStockItems.length > 0 ? '4px solid #e03131' : '' }}>
                    <div className={`stat-icon-box ${data.lowStockItems.length > 0 ? 'icon-red' : 'icon-gray'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Alertas de Stock</div>
                        <div className="stat-value" style={{ color: data.lowStockItems.length > 0 ? '#e03131' : '' }}>
                            {data.lowStockItems.length} {data.lowStockItems.length === 1 ? 'Ítem' : 'Ítems'}
                        </div>
                    </div>
                </div>

                {/* 5. ACCESO WEBMAIL */}
                {(profile?.is_superuser || profile?.profile?.can_use_webmail) && (
                    <a 
                        href="https://webmail.dondominio.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="stat-card icon-blue"
                    >
                        <div className="stat-icon-box icon-blue" style={{ background: '#d0ebff' }}>
                            <Mail size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Correo Corporativo</div>
                            <div className="stat-value" style={{ fontSize: '1.2rem', color: '#1c7ed6' }}>ACCEDER WEBMAIL ↗</div>
                        </div>
                    </a>
                )}

                {/* 6. HISTORIAL */}
                {(profile?.is_superuser || profile?.profile?.can_use_accounting) && (
                    <Link to="/admin/historial" className="stat-card">
                        <div className="stat-icon-box icon-gray">
                            <History size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Auditoría</div>
                            <div className="stat-value">HISTORIAL</div>
                        </div>
                    </Link>
                )}

                {/* 7. CONFIGURACIÓN */}
                {(profile?.is_superuser || profile?.profile?.can_use_settings) && (
                    <Link to="/admin/config" className="stat-card">
                        <div className="stat-icon-box icon-dark">
                            <SettingsIcon size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Sistema</div>
                            <div className="stat-value">CONFIGURACIÓN</div>
                        </div>
                    </Link>
                )}
            </div>

            {/* DETALLE DE STOCK BAJO */}
            {data.lowStockItems.length > 0 && (
                <div className="critical-section">
                    <h3 className="critical-title">
                        <Package size={22} /> Insumos con Stock Crítico
                    </h3>
                    <div className="critical-grid">
                        {data.lowStockItems.map(item => (
                            <div key={item.id} className="critical-item">
                                <div>
                                    <div className="critical-item-name">{item.name}</div>
                                    <div className="critical-item-qty">Quedan: {item.quantity} {item.unit}</div>
                                </div>
                                <AlertTriangle size={16} color="#e03131" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
