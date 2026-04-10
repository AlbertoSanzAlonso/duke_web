import React, { useState, useEffect } from 'react';
import { fetchSales, markSaleAsPrepared, markSaleAsDelivered, revertSaleDelivery, revertSalePrepared, deleteSale } from '../../services/api';
import { Utensils, Clock, CheckCircle, Package, History, ArrowLeftRight, Settings } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import './Kitchen.css';

const Kitchen = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [readyOrders, setReadyOrders] = useState([]);
    const [collectedOrders, setCollectedOrders] = useState([]);
    
    // activeTab: 'pending' | 'ready' | 'collected'
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [toast, setToast] = useState(null);
    
    const [actionModal, setActionModal] = useState({ isOpen: false, order: null });
    const activeTabRef = React.useRef(activeTab);

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '---';
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const handleNewOrder = () => {
            console.log("Kitchen refresh triggered from Event/SSE");
            loadKitchenOrders();
            // Notificamos sonido solo si estamos viendo pendientes para no confundir
            if (activeTabRef.current === 'pending') {
                const beep = new AudioContext();
                const osc = beep.createOscillator();
                const gain = beep.createGain();
                osc.connect(gain);
                gain.connect(beep.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, beep.currentTime);
                gain.gain.setValueAtTime(0.05, beep.currentTime);
                osc.start();
                osc.stop(beep.currentTime + 0.1);
            }
        };

        // SSE Connection for isolated Kitchen view
        let es = null;
        const isStandalone = window.location.pathname === '/cocina';
        
        const connectSSE = () => {
            const token = sessionStorage.getItem('duke_admin_token');
            const sseUrl = `${import.meta.env.VITE_API_URL || ''}/api/orders-stream/?token=${token ? token.trim() : ''}`;
            console.log("SSE Standalone Kitchen: Connecting to", sseUrl);
            es = new EventSource(sseUrl, { withCredentials: true });
            
            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_order' || data.type === 'order_updated') {
                        handleNewOrder();
                    }
                } catch (e) {}
            };

            es.onerror = () => {
                if (es) {
                    es.close();
                    setTimeout(connectSSE, 10000); // Reintento robusto
                }
            };
        };
        
        if (isStandalone) connectSSE();
        loadKitchenOrders(); // Initial load

        window.addEventListener('new-order-received', handleNewOrder);
        return () => {
            clearInterval(timer);
            window.removeEventListener('new-order-received', handleNewOrder);
            if (es) es.close();
        };
    }, []); // Only once at mount

    const loadKitchenOrders = async () => {
        try {
            const data = await fetchSales();
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
            
            // Filtro estricto de tiempo (últimas 16 horas para evitar tickets fantasma de días anteriores)
            const activeOrders = data.filter(o => {
                const now = new Date();
                const orderDate = new Date(o.date);
                const hoursSinceCreated = (now - orderDate) / (1000 * 60 * 60);
                
                // 1. Si el pedido tiene más de 16 horas de antigüedad, nunca mostrar en cocina
                if (hoursSinceCreated > 16) return false;
                
                // 2. Si es de las últimas 16 horas y NO está entregado, siempre mostrar (como pendiente o listo)
                if (!o.is_delivered) return true;
                
                // 3. Si ESTÁ entregado, lo mostramos en historial solo durante las siguientes 6 horas desde la entrega
                const deliveredDate = o.delivered_at ? new Date(o.delivered_at) : 
                                      (o.updated_at ? new Date(o.updated_at) : new Date(o.date));
                                      
                // Protección contra fechas inválidas
                if (isNaN(deliveredDate.getTime())) return true; // Mostrar por defecto si hay un fallo de parseo
                
                const hoursSinceDelivered = (now - deliveredDate) / (1000 * 60 * 60);
                return hoursSinceDelivered <= 6;
            });

            // Separamos por estado
            const pending = activeOrders.filter(o => !o.is_prepared);
            const ready = activeOrders.filter(o => o.is_prepared && !o.is_delivered);
            const collected = activeOrders.filter(o => o.is_prepared && o.is_delivered);
            
            setPendingOrders(pending.sort((a, b) => new Date(a.date) - new Date(b.date))); 
            
            setReadyOrders(ready.sort((a, b) => {
                const dateA = a.prepared_at ? new Date(a.prepared_at) : (a.updated_at ? new Date(a.updated_at) : new Date(a.date));
                const dateB = b.prepared_at ? new Date(b.prepared_at) : (b.updated_at ? new Date(b.updated_at) : new Date(b.date));
                return dateB - dateA;
            })); 
            
            setCollectedOrders(collected.sort((a, b) => {
                const dateA = a.delivered_at ? new Date(a.delivered_at) : (a.updated_at ? new Date(a.updated_at) : new Date(a.date));
                const dateB = b.delivered_at ? new Date(b.delivered_at) : (b.updated_at ? new Date(b.updated_at) : new Date(b.date));
                return dateB - dateA;
            }));
        } catch (error) {
            console.error("Error loading kitchen orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType, order) => {
        setActionModal({ isOpen: false, order: null });
        try {
            if (actionType === 'TO_READY') {
                await markSaleAsPrepared(order.id);
                setToast({ message: `Pedido #${order.id} enviado a LISTOS`, type: 'success' });
            } else if (actionType === 'TO_PENDING') {
                await revertSalePrepared(order.id);
                setToast({ message: `Pedido #${order.id} devuelto a PENDIENTES`, type: 'info' });
            } else if (actionType === 'TO_COLLECTED') {
                await markSaleAsDelivered(order.id);
                setToast({ message: `Pedido #${order.id} marcado como RECOGIDO`, type: 'success' });
            } else if (actionType === 'REVERT_COLLECTED') {
                await revertSaleDelivery(order.id);
                setToast({ message: `Pedido #${order.id} devuelto a LISTOS`, type: 'info' });
            } else if (actionType === 'DELETE') {
                await deleteSale(order.id);
                setToast({ message: `Pedido #${order.id} eliminado`, type: 'success' });
            }
            loadKitchenOrders();
        } catch (error) {
            setToast({ message: "Error al realizar la acción", type: 'error' });
        }
    };

    if (loading) return <LoadingScreen />;

    const getDisplayOrders = () => {
        if (activeTab === 'pending') return pendingOrders;
        if (activeTab === 'ready') return readyOrders;
        return collectedOrders;
    };

    const currentDisplay = getDisplayOrders();

    return (
        <div className="kitchen-container">
            <header className="kitchen-header">
                <div className="header-top">
                    <h1><Utensils size={40} /> COCINA DUKE</h1>
                    <div className="kitchen-clock">
                        {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                    </div>
                </div>
                
                <div className="kitchen-nav">
                    <button 
                        className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('pending')}
                    >
                        PENDIENTES ({pendingOrders.length})
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'ready' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('ready')}
                    >
                        LISTOS ({readyOrders.length})
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'collected' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('collected')}
                    >
                        RECOGIDOS ({collectedOrders.length})
                    </button>
                </div>
            </header>

            <div className="kitchen-grid">
                {currentDisplay.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                        <Package size={80} style={{ marginBottom: '20px' }} />
                        <h2>
                            {activeTab === 'pending' && 'SIN PEDIDOS PENDIENTES'}
                            {activeTab === 'ready' && 'SIN PEDIDOS LISTOS'}
                            {activeTab === 'collected' && 'HISTORIAL DE RECOGIDOS VACÍO'}
                        </h2>
                    </div>
                ) : (
                    currentDisplay.map(order => (
                        <div 
                            key={order.id} 
                            className={`kitchen-card ${activeTab === 'pending' ? 'new-order' : (activeTab === 'ready' ? 'ready-card' : 'collected-card')}`}
                            onClick={() => setActionModal({ isOpen: true, order })}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="kitchen-card-header">
                                <span className="ticket-number">#{order.id}</span>
                                <span className="ticket-time">
                                    <Clock size={14} /> 
                                    {formatTime(order.date)}
                                    {order.is_prepared && (
                                        <> | <span className="prepared-time">LISTO: {formatTime(order.prepared_at || order.updated_at)}</span></>
                                    )}
                                </span>
                            </div>
                            <div className="kitchen-card-body">
                                <div className="customer-info">
                                    <span className="customer-name">{order.customer_name || 'Particular'}</span>
                                    {order.customer_name?.includes('(Ampl. #') && (
                                        <div style={{ background: '#ff922b', color: '#fff', fontSize: '0.65rem', fontWeight: '900', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>AMPLIACIÓN</div>
                                    )}
                                    {order.table_number && <span className="table-info">{order.table_number}</span>}
                                </div>
                                <div className="items-list-kitchen">
                                    {order.items.map(item => (
                                        <div key={item.id} className="kitchen-item">
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className="item-qty">{item.quantity}</span>
                                                <span className="item-name">{item.entry_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {order.notes && (
                                    <div className="order-notes">
                                        <strong>NOTAS:</strong> {order.notes}
                                    </div>
                                )}
                            </div>
                            <div className="kitchen-card-footer">
                                <div className="card-hint">
                                    <Settings size={18} /> Pulsa para gestionar opciones
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {actionModal.isOpen && actionModal.order && (
                <div className="modal-overlay">
                    <div className="admin-modal kitchen-options-modal" style={{ maxWidth: '400px' }}>
                        <div className="modal-content" style={{ padding: '25px', textAlign: 'center', background: '#fff', color: '#333', borderRadius: '16px' }}>
                            <h3 style={{ margin: '0 0 20px', fontSize: '1.5rem', fontWeight: '900' }}>
                                GESTIÓN TICKET #{actionModal.order.id}
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {activeTab === 'pending' && (
                                    <>
                                        <button onClick={() => handleAction('TO_READY', actionModal.order)} style={{ padding: '15px', background: '#2b8a3e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>MARCAR COMO LISTO</button>
                                        <button onClick={() => handleAction('TO_COLLECTED', actionModal.order)} style={{ padding: '15px', background: '#4dabf7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>MARCAR COMO ESTUVO RECOGIDO DIRECTAMENTE</button>
                                    </>
                                )}
                                
                                {activeTab === 'ready' && (
                                    <>
                                        <button onClick={() => handleAction('TO_COLLECTED', actionModal.order)} style={{ padding: '15px', background: '#4dabf7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>MARCAR COMO RECOGIDO</button>
                                        <button onClick={() => handleAction('TO_PENDING', actionModal.order)} style={{ padding: '15px', background: '#f59f00', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>VOLVER A PENDIENTE (En Cocción)</button>
                                    </>
                                )}
                                
                                {activeTab === 'collected' && (
                                    <>
                                        <button onClick={() => handleAction('REVERT_COLLECTED', actionModal.order)} style={{ padding: '15px', background: '#2b8a3e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>VOLVER A LISTO (No fue entregado)</button>
                                        <button onClick={() => handleAction('TO_PENDING', actionModal.order)} style={{ padding: '15px', background: '#f59f00', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>VOLVER A PENDIENTE (En Cocción)</button>
                                    </>
                                )}
                                
                                <button onClick={() => {
                                    if(window.confirm('¿Estás SEGURO de que quieres eliminar este ticket permanentemente? Esta acción destruirá el pedido y no se cobrará.')) {
                                        handleAction('DELETE', actionModal.order);
                                    }
                                }} style={{ padding: '15px', background: '#f03e3e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>ELIMINAR TICKET</button>
                                
                                <button onClick={() => setActionModal({ isOpen: false, order: null })} style={{ padding: '15px', background: '#f1f3f5', color: '#333', border: '1px solid #ccc', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>CANCELAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Kitchen;
