import React, { useState, useEffect } from 'react';
import { fetchSales, fetchMenuEntries, fetchOpeningHours, fetchInventory } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import { ShoppingBag, Star, Clock, AlertTriangle, TrendingUp, Package, CalendarOff } from 'lucide-react';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        todaySalesCount: 0,
        activePromos: 0,
        todayHours: null,
        lowStockItems: []
    });

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const [sales, menu, hours, inventory] = await Promise.all([
                    fetchSales(),
                    fetchMenuEntries(),
                    fetchOpeningHours(),
                    fetchInventory()
                ]);

                // 1. Sales today (Local Time)
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todaysSales = sales.filter(s => new Date(s.date) >= todayStart);
                
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
        <div style={{ padding: '10px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: '900', color: '#1a1b1e', letterSpacing: '-1px' }}>
                    DUKE <span style={{ color: '#f03e3e' }}>INSIGHTS</span>
                </h1>
                <p style={{ color: '#666', margin: '5px 0' }}>Estado operativo de la sucursal en tiempo real</p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
                gap: '20px',
                marginBottom: '40px'
            }}>
                {/* 1. PEDIDOS HOY */}
                <div className="admin-card" style={cardStyle}>
                    <div style={iconBoxStyle('#fff5f5', '#f03e3e')}>
                        <ShoppingBag size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Pedidos de Hoy</div>
                        <div style={valueStyle}>{data.todaySalesCount}</div>
                    </div>
                    <div style={{ color: '#2b8a3e', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        <TrendingUp size={14} style={{ marginRight: '4px' }} /> EN VIVO
                    </div>
                </div>

                {/* 2. PROMOS ACTIVAS */}
                <div className="admin-card" style={cardStyle}>
                    <div style={iconBoxStyle('#fff9db', '#f08c00')}>
                        <Star size={24} />
                    </div>
                    <div>
                        <div style={labelStyle}>Promos en Cartelera</div>
                        <div style={valueStyle}>{data.activePromos}</div>
                    </div>
                </div>

                {/* 3. HORARIO HOY */}
                <div className="admin-card" style={cardStyle}>
                    <div style={iconBoxStyle('#f3f0ff', '#7950f2')}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={labelStyle}>Horario de Hoy</div>
                        <div style={valueStyle}>
                            {data.todayHours?.is_open 
                                ? `${data.todayHours.opening_time.slice(0,5)} - ${data.todayHours.closing_time.slice(0,5)}` 
                                : 'CERRADO'}
                        </div>
                    </div>
                </div>

                {/* 4. STOCK CRÍTICO */}
                <div className="admin-card" style={{ ...cardStyle, borderLeft: data.lowStockItems.length > 0 ? '4px solid #e03131' : '1px solid #eee' }}>
                    <div style={iconBoxStyle(data.lowStockItems.length > 0 ? '#fff5f5' : '#f8f9fa', data.lowStockItems.length > 0 ? '#e03131' : '#adb5bd')}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div style={labelStyle}>Alertas de Stock</div>
                        <div style={{ ...valueStyle, color: data.lowStockItems.length > 0 ? '#e03131' : '#333' }}>
                            {data.lowStockItems.length} {data.lowStockItems.length === 1 ? 'Ítems' : 'Ítems'}
                        </div>
                    </div>
                </div>
            </div>

            {/* DETALLE DE STOCK BAJO (Si hay) */}
            {data.lowStockItems.length > 0 && (
                <div className="admin-card" style={{ padding: '25px', background: '#fff5f5', border: '1px solid #ffc9c9' }}>
                    <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#c92a2a' }}>
                        <Package size={22} /> Insumos con Stock Crítico
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {data.lowStockItems.map(item => (
                            <div key={item.id} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #ffa8a8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#e03131' }}>Quedan: {item.quantity} {item.unit}</div>
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

const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '25px',
    transition: 'transform 0.2s ease',
    cursor: 'default'
};

const iconBoxStyle = (bg, color) => ({
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

const labelStyle = {
    fontSize: '0.85rem',
    color: '#868e96',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
};

const valueStyle = {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#212529'
};

export default Dashboard;
