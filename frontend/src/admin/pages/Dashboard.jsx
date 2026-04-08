import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardInsights } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import { ShoppingBag, Star, Clock, AlertTriangle, TrendingUp, Package, CalendarOff, Mail, History, Settings as SettingsIcon, Plus } from 'lucide-react';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        todaySalesCount: 0,
        pendingToday: 0,
        completedToday: 0,
        activePromos: 0,
        todayHours: null,
        lowStockItems: [],
        unreadEmails: 0,
        mailConfigured: true
    });
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const insights = await fetchDashboardInsights();
                
                setProfile(insights.profile);
                setData({
                    todaySalesCount: insights.today_sales.total_count,
                    pendingToday: insights.today_sales.pending,
                    completedToday: insights.today_sales.completed,
                    activePromos: insights.active_promos,
                    todayHours: insights.today_hours,
                    lowStockItems: insights.low_stock,
                    unreadEmails: insights.unread_mail,
                    mailConfigured: insights.unread_mail !== -1
                });

            } catch (err) {
                console.error("Error loading dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
        
        // Listen for real-time updates and manual config changes
        const handleRefresh = () => {
            loadDashboardData();
        };

        window.addEventListener('new-order-received', handleRefresh);
        window.addEventListener('config-updated', handleRefresh);

        // Refresh every 10 seconds
        const interval = setInterval(loadDashboardData, 10000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('new-order-received', handleRefresh);
            window.removeEventListener('config-updated', handleRefresh);
        };
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
                <Link to="/admin/promos" className="stat-card" style={{ flexDirection: 'column', textAlign: 'center', textDecoration: 'none' }}>
                    <div className="stat-icon-box icon-orange" style={{ margin: '0 auto 10px' }}>
                        <Star size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Promos en Cartelera</div>
                        <div className="stat-value" style={{ fontSize: '1.8rem' }}>{data.activePromos}</div>
                    </div>
                </Link>

                {/* 3. HORARIO HOY */}
                <Link to="/admin/config?tab=hours" className="stat-card" style={{ textDecoration: 'none' }}>
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
                </Link>

                {/* 4. STOCK CRÍTICO */}
                <Link to="/admin/inventario" className={`stat-card ${data.lowStockItems.length > 0 ? 'critical-border' : ''}`} style={{ borderLeft: data.lowStockItems.length > 0 ? '4px solid #e03131' : '', textDecoration: 'none' }}>
                    <div className={`stat-icon-box ${data.lowStockItems.length > 0 ? 'icon-red' : 'icon-gray'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Alertas de Stock</div>
                        <div className="stat-value" style={{ color: data.lowStockItems.length > 0 ? '#e03131' : '' }}>
                            {data.lowStockItems.length} {data.lowStockItems.length === 1 ? 'Ítem' : 'Ítems'}
                        </div>
                    </div>
                </Link>

                {/* 5. ACCESO WEBMAIL */}
                    <a 
                        href="https://webmail.dondominio.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="stat-card icon-blue"
                        style={{ position: 'relative' }}
                    >
                        <div className="stat-icon-box icon-blue" style={{ background: '#d0ebff' }}>
                            <Mail size={24} />
                        </div>
                        {data.unreadEmails > 0 && (
                            <div style={{ 
                                position: 'absolute', top: '-5px', right: '-5px', 
                                background: '#e03131', color: 'white', 
                                borderRadius: '50%', width: '24px', height: '24px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: '900', border: '2px solid white',
                                animation: 'pulse 2s infinite',
                                zIndex: 10
                            }}>
                                {data.unreadEmails}
                            </div>
                        )}
                        {data.unreadEmails === -1 && (
                            <div title="Error de conexión IMAP" style={{ 
                                position: 'absolute', top: '-5px', right: '-5px', 
                                background: '#f08c00', color: 'white', 
                                borderRadius: '50%', width: '24px', height: '24px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid white', zIndex: 10
                            }}>
                                <AlertTriangle size={14} />
                            </div>
                        )}
                        <div className="stat-content">
                            <div className="stat-label">Correo Corporativo</div>
                            <div className="stat-value" style={{ fontSize: '1.2rem', color: '#1c7ed6' }}>
                                {data.unreadEmails > 0 ? `${data.unreadEmails} NUEVOS ↗` : 
                                 data.unreadEmails === -1 ? 'ERROR CONFIG. ↗' : 
                                 !data.mailConfigured ? 'SIN CONFIG. ↗' : 'ACCEDER ↗'}
                            </div>
                        </div>
                    </a>

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

                {/* 8. AÑADIR GASTO/INGRESO - ACCIÓN RÁPIDA */}
                {(profile?.is_superuser || profile?.profile?.can_use_accounting) && (
                    <Link 
                        to="/admin/contabilidad?action=new" 
                        className="stat-card"
                        style={{ textDecoration: 'none' }}
                    >
                        <div className="stat-icon-box" style={{ background: '#2b8a3e', color: 'white' }}>
                            <Plus size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Gestión Financiera</div>
                            <div className="stat-value" style={{ color: '#2b8a3e', fontSize: '1.2rem' }}>AÑADIR MOVIMIENTO</div>
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
