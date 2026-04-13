import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardInsights } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import { ShoppingBag, Star, Clock, AlertTriangle, Package, Mail, History, Settings as SettingsIcon, Plus, Utensils, HelpCircle } from 'lucide-react';
import Toast from '../components/Toast';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        todaySalesCount: 0,
        pendingToday: 0,
        completedToday: 0,
        kitchenPending: 0,
        kitchenReady: 0,
        kitchenDelivered: 0,
        kitchenPendingList: [],
        kitchenReadyList: [],
        kitchenDeliveredList: [],
        activePromos: 0,
        todayHours: null,
        lowStockItems: [],
        unreadEmails: 0,
        mailConfigured: true
    });
    const [profile, setProfile] = useState(null);
    const [toast, setToast] = useState(null);
    const [showKitchenModal, setShowKitchenModal] = useState(false);
    const [showDeliveredModal, setShowDeliveredModal] = useState(false);
    const [actionOrder, setActionOrder] = useState(null);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const insights = await fetchDashboardInsights();
            
            setProfile(insights.profile);
            setData({
                todaySalesCount: insights.today_sales.total_count,
                pendingToday: insights.today_sales.pending,
                completedToday: insights.today_sales.completed,
                kitchenPending: insights.today_sales.kitchen_pending,
                kitchenReady: insights.today_sales.kitchen_ready,
                kitchenDelivered: insights.today_sales.kitchen_delivered || 0,
                kitchenPendingList: insights.today_sales.kitchen_pending_list,
                kitchenReadyList: insights.today_sales.kitchen_ready_list,
                kitchenDeliveredList: insights.today_sales.kitchen_delivered_list || [],
                activePromos: insights.active_promos,
                todayHours: insights.today_hours,
                lowStockItems: insights.low_stock,
                unreadEmails: insights.unread_mail,
                mailConfigured: insights.unread_mail !== -1
            });
        } catch (err) {
            console.error("Error loading dashboard:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData(false);
        
        const handleRefresh = () => loadData(true);
        window.addEventListener('new-order-received', handleRefresh);
        window.addEventListener('config-updated', handleRefresh);

        const interval = setInterval(() => loadData(true), 600000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('new-order-received', handleRefresh);
            window.removeEventListener('config-updated', handleRefresh);
        };
    }, []);

    useEffect(() => {
        if (showKitchenModal || showDeliveredModal) {
            loadData(true);
        }
    }, [showKitchenModal, showDeliveredModal]);

    const handleAction = async (orderId, type) => {
        try {
            const api = await import('../../services/api');
            if (type === 'DELETE') {
                if (!window.confirm("¿Eliminar este ticket permanentemente?")) return;
                await api.deleteSale(orderId);
            } else if (type === 'MARK_READY') {
                await api.markSaleAsPrepared(orderId);
            } else if (type === 'MARK_DELIVERED') {
                await api.markSaleAsDelivered(orderId);
            } else if (type === 'REVERT_PENDING') {
                await api.revertSalePrepared(orderId);
            } else if (type === 'REVERT_READY') {
                await api.revertSaleDelivery(orderId);
            }
            
            setToast({ message: "Operación realizada con éxito", type: 'success' });
            setActionOrder(null);
            loadData(true);
        } catch (error) {
            setToast({ message: "Error al realizar la operación", type: 'error' });
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="dash-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="dash-header">
                <h1 className="dash-title">
                    DUKE <span style={{ color: 'var(--admin-primary)' }}>INSIGHTS</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.3, marginLeft: '10px' }}>v1.1</span>
                </h1>
                <p className="dash-subtitle">Estado operativo de la sucursal en tiempo real</p>
            </div>

            <div className="dash-grid">
                <Link to="/admin/pedidos-clientes?filter=today" className="stat-card" style={{ textDecoration: 'none' }}>
                    <div className="stat-icon-box icon-red">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{data.todaySalesCount}</div>
                        <div className="stat-label">Pedidos de Hoy</div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#2b8a3e', fontWeight: 'bold' }}>{data.completedToday} Cobrados</span>
                            <span style={{ color: '#f08c00', fontWeight: 'bold' }}>{data.pendingToday} Pendientes</span>
                        </div>
                    </div>
                </Link>

                <div 
                    className="stat-card" 
                    onClick={() => setShowKitchenModal(true)}
                    style={{ 
                        cursor: 'pointer', 
                        background: data.kitchenReady > 0 ? '#fff5f5' : '',
                        transition: 'transform 0.2s',
                    }}
                >
                    <div className="stat-icon-box icon-gray">
                        <Utensils size={24} color={data.kitchenReady > 0 ? 'var(--admin-primary)' : ''} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Estado Cocina</div>
                        <div className="stat-value" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                           <div style={{ fontSize: '1.4rem' }}>{data.kitchenReady} <small style={{ fontSize: '0.7rem', color: '#2b8a3e' }}>LISTOS</small></div>
                           <div style={{ fontSize: '1.4rem', opacity: 0.6 }}>{data.kitchenPending} <small style={{ fontSize: '0.7rem' }}>EN COCCIÓN</small></div>
                        </div>
                    </div>
                </div>

                <Link to="/admin/promos" className="stat-card" style={{ flexDirection: 'column', textAlign: 'center', textDecoration: 'none' }}>
                    <div className="stat-icon-box icon-orange" style={{ margin: '0 auto 10px' }}>
                        <Star size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Promos en Cartelera</div>
                        <div className="stat-value" style={{ fontSize: '1.8rem' }}>{data.activePromos}</div>
                    </div>
                </Link>

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

                <a href="https://webmail.dondominio.com/" target="_blank" rel="noopener noreferrer" className="stat-card icon-blue" style={{ position: 'relative' }}>
                    <div className="stat-icon-box icon-blue" style={{ background: '#d0ebff' }}>
                        <Mail size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Correo Corporativo</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem', color: '#1c7ed6' }}>
                            {data.unreadEmails > 0 ? `${data.unreadEmails} NUEVOS ↗` : 'ACCEDER ↗'}
                        </div>
                    </div>
                </a>

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

                <Link to="/manual" className="stat-card" style={{ textDecoration: 'none' }}>
                    <div className="stat-icon-box icon-purple" style={{ background: '#f8f0fc' }}>
                        <HelpCircle size={24} color="#ae3ec9" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Ayuda y Soporte</div>
                        <div className="stat-value" style={{ color: '#ae3ec9' }}>MANUAL DE USO</div>
                    </div>
                </Link>
            </div>

            {showKitchenModal && (
                <div className="modal-overlay" onClick={() => setShowKitchenModal(false)} style={{ zIndex: 5000 }}>
                    <div className="admin-card modal-content" onClick={e => e.stopPropagation()} style={{ 
                        width: '95%', maxWidth: '550px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', 
                        padding: '0', overflow: 'hidden', borderRadius: '20px', position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333', background: '#1a1b1e', color: '#fff' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', color: '#fff' }}>
                                <Utensils color="var(--admin-primary)" /> Control de Cocina
                            </h2>
                            <button onClick={() => setShowKitchenModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}>×</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div className="stat-card" style={{ background: '#f8f9fa', padding: '15px' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>EN PREPARACIÓN</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{data.kitchenPending}</div>
                                </div>
                                <div className="stat-card" style={{ background: '#ebfbee', padding: '15px' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#2b8a3e', fontWeight: 'bold' }}>LISTOS HOY</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2b8a3e' }}>{data.kitchenReady}</div>
                                </div>
                            </div>

                            <div className="kitchen-lists-split">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#2b8a3e', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                        Pedidos Listos
                                    </h4>
                                    <button onClick={() => { setShowKitchenModal(false); setShowDeliveredModal(true); }} style={{ background: '#f1f3f5', border: 'none', fontSize: '0.7rem', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}>
                                        VER RECOGIDOS ({data.kitchenDelivered})
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {Array.isArray(data?.kitchenReadyList) && data.kitchenReadyList.map(order => (
                                        <div key={order.id} onClick={() => setActionOrder({...order, currentStatus: 'READY'})} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '4px solid #40c057', cursor: 'pointer' }}>
                                            <span><strong>#{order.id}</strong> {order.customer}</span>
                                            <span style={{ fontSize: '0.7rem', color: '#666' }}>✅ {order.updated_at ? new Date(order.updated_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '--:--'}</span>
                                        </div>
                                    ))}
                                </div>

                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#e03131', marginTop: '20px' }}>En Cocción</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {Array.isArray(data?.kitchenPendingList) && data.kitchenPendingList.map(order => (
                                        <div key={order.id} onClick={() => setActionOrder({...order, currentStatus: 'PENDING'})} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '4px solid #f03e3e', cursor: 'pointer' }}>
                                            <span><strong>#{order.id}</strong> {order.customer}</span>
                                            <span style={{ fontSize: '0.7rem', color: '#e03131' }}>⏲️ {order.created_at ? new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '--:--'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {actionOrder && (
                            <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 6000 }} onClick={() => setActionOrder(null)}>
                                <div className="admin-card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '350px', padding: '0', borderRadius: '15px', overflow: 'hidden' }}>
                                    <div style={{ padding: '20px', background: '#1a1b1e', color: '#fff' }}>
                                        <h3 style={{ margin: 0 }}>Pedido #{actionOrder.id}</h3>
                                        <p style={{ margin: '5px 0 0', opacity: 0.8 }}>{actionOrder.customer}</p>
                                    </div>
                                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {actionOrder.currentStatus === 'PENDING' && (
                                            <button onClick={() => handleAction(actionOrder.id, 'MARK_READY')} style={{ padding: '15px', background: '#40c057', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>PASAR A LISTO</button>
                                        )}
                                        {actionOrder.currentStatus === 'READY' && (
                                            <>
                                                <button onClick={() => handleAction(actionOrder.id, 'MARK_DELIVERED')} style={{ padding: '15px', background: '#228be6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>MARCAR RECOGIDO</button>
                                                <button onClick={() => handleAction(actionOrder.id, 'REVERT_PENDING')} style={{ padding: '15px', background: '#f03e3e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>VOLVER A COCCIÓN</button>
                                            </>
                                        )}
                                        {actionOrder.currentStatus === 'COLLECTED' && (
                                            <button onClick={() => handleAction(actionOrder.id, 'REVERT_READY')} style={{ padding: '15px', background: '#40c057', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>REVERTIR A LISTO</button>
                                        )}
                                        <button onClick={() => handleAction(actionOrder.id, 'DELETE')} style={{ padding: '15px', color: '#e03131', background: '#fff', border: '1px solid #ddd', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>ELIMINAR TICKET</button>
                                        <button onClick={() => setActionOrder(null)} style={{ padding: '15px', background: '#f1f3f5', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>CANCELAR</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                            <Link to="/admin/cocina" className="add-movement-btn" style={{ display: 'block', textDecoration: 'none', background: '#1a1b1e', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }} onClick={() => setShowKitchenModal(false)}>VER PANEL COMPLETO</Link>
                        </div>
                    </div>
                </div>
            )}

            {showDeliveredModal && (
                <div className="modal-overlay" onClick={() => setShowDeliveredModal(false)} style={{ zIndex: 5000 }}>
                    <div className="admin-card modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', borderRadius: '20px' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>📦 Recogidos (Hoy)</h3>
                            <button onClick={() => setShowDeliveredModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            {Array.isArray(data?.kitchenDeliveredList) && data.kitchenDeliveredList.map(order => (
                                <div key={order.id} onClick={() => setActionOrder({...order, currentStatus: 'COLLECTED'})} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                                    <span><strong>#{order.id}</strong> {order.customer}</span>
                                    <span style={{ fontSize: '0.7rem' }}>⏲️ {order.created_at ? new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) : '--:--'}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
                            <button onClick={() => { setShowDeliveredModal(false); setShowKitchenModal(true); }} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', background: '#f8f9fa', fontWeight: 'bold', cursor: 'pointer' }}>VOLVER AL CONTROL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
