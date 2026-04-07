import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchSales } from '../../services/api';
import { Printer, Eye, Calendar, User, Hash, Search, Filter, LayoutGrid } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams] = useSearchParams();
    const [filterType, setFilterType] = useState('all'); // 'all', 'daily', 'weekly', 'monthly'
    const [showStatsModal, setShowStatsModal] = useState(false);
    const navigate = useNavigate();

    // ... (rest of search/memo logic remains same)
    // ... loadOrders here briefly to restore context if needed ...

    useEffect(() => {
        const initialFilter = searchParams.get('filter');
        if (initialFilter === 'today') setFilterType('daily');
        loadOrders();
    }, [searchParams]);

    const loadOrders = async () => {
        try {
            const data = await fetchSales();
            setOrders(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        let filtered = [...orders];

        // 1. Time filter
        const now = new Date();
        if (filterType === 'daily') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter(o => new Date(o.date) >= today);
        } else if (filterType === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            filtered = filtered.filter(o => new Date(o.date) >= lastWeek);
        } else if (filterType === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(now.getMonth() - 1);
            filtered = filtered.filter(o => new Date(o.date) >= lastMonth);
        }

        // 2. Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o => 
                o.id.toString().includes(term) ||
                (o.customer_name || "").toLowerCase().includes(term) ||
                (o.table_number || "").toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [orders, filterType, searchTerm]);

    const totalIncome = useMemo(() => {
        return filteredOrders.reduce((acc, o) => acc + parseFloat(o.total_amount), 0);
    }, [filteredOrders]);

    const handlePrint = (order) => {
        window.print();
    };

    if (loading) return <LoadingScreen />;

    // ... header JSX ...

    return (
        <div className="orders-container">
            <div className="orders-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                    <h2 style={{ margin: 0 }}>Gestión de Pedidos</h2>
                    <div className="search-bar" style={{ position: 'relative', maxWidth: '300px', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por ID, nombre o mesa..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', width: '100%', background: '#fff' }}
                        />
                    </div>
                </div>

                <div className="orders-summary-group">
                    <div className="filter-group-segmented" style={{ display: 'flex', background: '#f1f3f5', padding: '4px', borderRadius: '10px' }}>
                        {[
                            { id: 'all', label: 'TODO' },
                            { id: 'daily', label: 'DIARIO' },
                            { id: 'weekly', label: 'SEMANAL' },
                            { id: 'monthly', label: 'MENSUAL' }
                        ].map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setFilterType(f.id)}
                                className={`mode-selector-btn ${filterType === f.id ? 'active' : ''}`}
                                style={{ padding: '8px 15px', borderRadius: '8px', minWidth: '80px' }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="orders-stats" style={{ cursor: 'pointer' }} onClick={() => setShowStatsModal(true)}>
                        <div className="stat-card">
                            <span>Pedidos</span>
                            <strong>{filteredOrders.length}</strong>
                        </div>
                        <div className="stat-card">
                            <span>Ingresos</span>
                            <strong style={{ color: '#2b8a3e' }}>${Math.round(totalIncome).toLocaleString('es-AR')}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="orders-grid">
                <div className="orders-list-card admin-card">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th><Hash size={14} /> ID</th>
                                <th><Calendar size={14} /> Fecha</th>
                                <th><User size={14} /> Cliente / Entrega</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} className={selectedOrder?.id === order.id ? 'selected' : ''} onClick={() => setSelectedOrder(order)}>
                                    <td data-label="ID">#{order.id}</td>
                                    <td data-label="Fecha">
                                        <div className="date-cell">
                                            <span>{new Date(order.date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</span>
                                            <small>{new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}</small>
                                        </div>
                                    </td>
                                    <td data-label="Cliente">
                                        <div className="client-cell">
                                            <strong>{order.customer_name || 'Sin nombre'}</strong>
                                            {order.table_number && <span className="table-badge">{order.table_number}</span>}
                                        </div>
                                    </td>
                                    <td data-label="Total" className="total-cell">${Math.round(parseFloat(order.total_amount)).toLocaleString('es-AR')}</td>
                                    <td data-label="Estado">
                                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                                            {order.status === 'PENDING' ? 'Pendiente' : order.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                                        </span>
                                    </td>
                                    <td data-label="Acción">
                                        <div className="row-actions" style={{ display: 'flex', gap: '5px' }}>
                                            <button className="icon-btn print" title="Imprimir" onClick={(e) => { e.stopPropagation(); handlePrint(order); }}>
                                                <Printer size={18} />
                                            </button>
                                            {order.status === 'PENDING' && (
                                                <button className="icon-btn tpv" title="Ir al TPV" onClick={(e) => { e.stopPropagation(); navigate('/admin/tpv', { state: { pendingOrder: order } }); }}>
                                                    <LayoutGrid size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedOrder && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)} style={{ zIndex: 3000 }}>
                        <div className="order-details-card admin-card order-details-modal" onClick={e => e.stopPropagation()}>
                            <div className="details-header">
                                <h3>Pedido #{selectedOrder.id}</h3>
                                <button className="close-details" onClick={() => setSelectedOrder(null)}>×</button>
                            </div>
                            
                            <div className="details-content">
                                <div className="details-meta">
                                    <p><span>Cliente:</span> <strong>{selectedOrder.customer_name || '-'}</strong></p>
                                    <p><span>Entrega:</span> <strong>{selectedOrder.table_number || '-'}</strong></p>
                                    <p><span>Hora/Fecha:</span> <strong>{new Date(selectedOrder.date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</strong></p>
                                    <p><span>Estado:</span> <span className={`status-badge ${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span></p>
                                </div>

                                <div className="items-list">
                                    <h4>Productos</h4>
                                    {selectedOrder.items.map(item => (
                                        <div key={item.id} className="detail-item">
                                            <span style={{ fontWeight: '700' }}>{item.quantity} x {item.entry_name}</span>
                                            <span style={{ color: '#666' }}>${(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="details-total" style={{ borderTop: '2px solid #333', paddingTop: '15px', marginTop: '10px' }}>
                                    <span style={{ fontWeight: '900', fontSize: '0.9rem', color: '#888' }}>TOTAL</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        {parseFloat(selectedOrder.delivery_cost) > 0 && (
                                            <small style={{ fontSize: '0.8rem', color: '#666' }}>Envío: ${parseFloat(selectedOrder.delivery_cost).toLocaleString('es-AR')}</small>
                                        )}
                                        <strong style={{ fontSize: '2rem', fontWeight: '900', color: '#000' }}>${Math.round(parseFloat(selectedOrder.total_amount)).toLocaleString('es-AR')}</strong>
                                    </div>
                                </div>

                                <div className="modal-actions-footer" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                                    <button className="print-full-btn" style={{ flex: 1, padding: '12px', fontSize: '0.8rem' }} onClick={() => handlePrint(selectedOrder)}>
                                        <Printer size={16} /> IMPRIMIR
                                    </button>
                                    {selectedOrder.status === 'PENDING' && (
                                        <button 
                                            className="print-full-btn" 
                                            style={{ flex: 1, background: '#2b8a3e', padding: '12px', fontSize: '0.8rem' }} 
                                            onClick={() => navigate('/admin/tpv', { state: { pendingOrder: selectedOrder } })}
                                        >
                                            <LayoutGrid size={16} /> COBRAR
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Area de Impresion Oculta */}
            <div id="ticket-print-area" className="print-only">
                {selectedOrder && (
                    <div className="thermal-ticket">
                        <div className="ticket-header-print">
                            <h1>DUKE BURGERS</h1>
                            <p>San Juan, Argentina</p>
                            <div className="ticket-divider"></div>
                        </div>
                        <div className="ticket-info-print">
                            <p>TICKET #{selectedOrder.id}</p>
                            <p>FECHA: {new Date(selectedOrder.date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
                            <p>CLIENTE: {selectedOrder.customer_name || 'Particular'}</p>
                            {selectedOrder.table_number && <p>ENTREGA: {selectedOrder.table_number}</p>}
                        </div>
                        <div className="ticket-divider"></div>
                        <div className="ticket-items-print">
                            {selectedOrder.items.map(item => (
                                <div key={item.id} className="ticket-row">
                                    <span>{item.quantity} x {item.entry_name}</span>
                                    <span>${(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="ticket-divider"></div>
                        <div className="ticket-total-print">
                            {parseFloat(selectedOrder.delivery_cost) > 0 && (
                                <div className="ticket-row" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                                    <span>Envío:</span>
                                    <span>${parseFloat(selectedOrder.delivery_cost).toLocaleString('es-AR')}</span>
                                </div>
                            )}
                            <div className="ticket-row">
                                <span>TOTAL:</span>
                                <strong>${parseFloat(selectedOrder.total_amount).toLocaleString('es-AR')}</strong>
                            </div>
                        </div>
                        <div className="ticket-footer-print">
                            <p>¡Gracias por su visita!</p>
                            <p>dukeburger-sj.com</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Estadísticas Detalladas */}
            {showStatsModal && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setShowStatsModal(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.9)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 4000,
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div 
                        className="admin-card" 
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '95%', maxWidth: '500px', padding: '30px',
                            border: '1px solid #f03e3e', position: 'relative',
                            textAlign: 'center'
                        }}
                    >
                        <button 
                            onClick={() => setShowStatsModal(false)}
                            style={{ 
                                position: 'absolute', top: '15px', right: '15px',
                                background: 'none', border: 'none', color: '#888',
                                cursor: 'pointer', fontSize: '24px'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ 
                                background: '#f03e3e15', width: '60px', height: '60px', 
                                borderRadius: '50%', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', margin: '0 auto 15px', color: '#f03e3e' 
                            }}>
                                <LayoutGrid size={32} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Resumen de Facturación
                            </h2>
                            <p style={{ color: '#999', margin: '5px 0 0 0', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800' }}>
                                Periodo: {filterType === 'all' ? 'Histórico Total' : filterType === 'daily' ? 'Hoy' : filterType === 'weekly' ? 'Última Semana' : 'Último Mes'}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '16px', border: '1px solid #eee' }}>
                                <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: '800' }}>Volumen de Ventas</span>
                                <h3 style={{ fontSize: '3rem', margin: '5px 0', fontWeight: '900' }}>{filteredOrders.length}</h3>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Pedidos Realizados</p>
                            </div>

                            <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '16px', border: '1px solid #eee' }}>
                                <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: '800' }}>Ingresos Totales</span>
                                <h3 style={{ fontSize: '3rem', margin: '5px 0', fontWeight: '900', color: '#2b8a3e' }}>
                                    ${Math.round(totalIncome).toLocaleString('es-AR')}
                                </h3>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Facturación Bruta</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowStatsModal(false)}
                            style={{ 
                                width: '100%', marginTop: '30px', padding: '15px', 
                                background: '#333', color: 'white', border: 'none', 
                                borderRadius: '12px', fontWeight: '900', cursor: 'pointer' 
                            }}
                        >
                            ENTENDIDO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
