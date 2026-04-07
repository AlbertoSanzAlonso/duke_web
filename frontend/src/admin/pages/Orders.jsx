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
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0 }}>Gestión de Pedidos</h2>
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
                </div>

                <div className="orders-summary-group" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por ID, cliente o entrega..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', width: '100%', background: '#fff' }}
                        />
                    </div>
                    <div className="orders-stats">
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
                    <div className="order-details-card admin-card">
                        <div className="details-header">
                            <h3>Detalle del Pedido #{selectedOrder.id}</h3>
                            <button className="close-details" onClick={() => setSelectedOrder(null)}>×</button>
                        </div>
                        
                        <div className="details-content">
                            <div className="details-meta">
                                <p><strong>Cliente:</strong> {selectedOrder.customer_name || '-'}</p>
                                <p><strong>Entrega:</strong> {selectedOrder.table_number || '-'}</p>
                                <p><strong>Hora:</strong> {new Date(selectedOrder.date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
                            </div>

                            <div className="items-list">
                                <h4>Productos</h4>
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="detail-item">
                                        <span>{item.quantity} x {item.entry_name}</span>
                                        <span>${(item.quantity * parseFloat(item.price_at_sale)).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="details-total" style={{ borderTop: '2px solid #333', paddingTop: '10px' }}>
                                <span style={{ fontWeight: '900', fontSize: '1rem' }}>TOTAL</span>
                                <strong style={{ fontSize: '1.8rem', fontWeight: '900' }}>${Math.round(parseFloat(selectedOrder.total_amount)).toLocaleString('es-AR')}</strong>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
                                <button className="print-full-btn" style={{ flex: 1, padding: '12px' }} onClick={() => handlePrint(selectedOrder)}>
                                    <Printer size={18} /> IMPRIMIR TICKET
                                </button>
                                {selectedOrder.status === 'PENDING' && (
                                    <button 
                                        className="print-full-btn" 
                                        style={{ flex: 1, background: '#2b8a3e', padding: '12px' }} 
                                        onClick={() => navigate('/admin/tpv', { state: { pendingOrder: selectedOrder } })}
                                    >
                                        <LayoutGrid size={18} /> COBRAR EN TPV
                                    </button>
                                )}
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
        </div>
    );
};

export default Orders;
