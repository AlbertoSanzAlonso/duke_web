import React, { useState, useEffect } from 'react';
import { fetchSales, markSaleAsPrepared, markSaleAsDelivered, revertSaleDelivery } from '../../services/api';
import { Utensils, Clock, CheckCircle, Package, History, ArrowLeftRight } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
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
    
    // Modal state
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        onConfirm: null,
        confirmText: 'Confirmar',
        type: 'info'
    });

    const formatTime = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '---';
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        loadKitchenOrders();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const handleNewOrder = () => {
            console.log("Kitchen refresh triggered");
            loadKitchenOrders();
            // Notificamos sonido solo si estamos viendo pendientes para no confundir
            if (activeTab === 'pending') {
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

        window.addEventListener('new-order-received', handleNewOrder);
        return () => {
            clearInterval(timer);
            window.removeEventListener('new-order-received', handleNewOrder);
        };
    }, [activeTab]);

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

    const handleReady = async (orderId) => {
        try {
            await markSaleAsPrepared(orderId);
            setToast({ message: `Pedido #${orderId} enviado a LISTOS`, type: 'success' });
            loadKitchenOrders();
        } catch (error) {
            setToast({ message: "Error al marcar como listo", type: 'error' });
        }
    };

    const showDeliverConfirm = (order) => {
        setConfirmModal({
            isOpen: true,
            title: 'Marcar como Recogido',
            message: `¿Estás seguro de que quieres pasar el pedido #${order.id} (${order.customer_name || 'Particular'}) a la lista de RECOGIDOS?`,
            confirmText: 'SÍ, ENTREGAR',
            type: 'success',
            onConfirm: async () => {
                try {
                    await markSaleAsDelivered(order.id);
                    setToast({ message: `Pedido #${order.id} marcado como recogido`, type: 'success' });
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    loadKitchenOrders();
                } catch (error) {
                    setToast({ message: "Error al marcar como entregado", type: 'error' });
                }
            }
        });
    };

    const showRevertConfirm = (order) => {
        setConfirmModal({
            isOpen: true,
            title: 'Revertir Entrega',
            message: `¿Quieres devolver el pedido #${order.id} a la lista de pedidos LISTOS?`,
            confirmText: 'SÍ, REVERTIR',
            type: 'info',
            onConfirm: async () => {
                try {
                    await revertSaleDelivery(order.id);
                    setToast({ message: `Pedido #${order.id} devuelto a LISTOS`, type: 'info' });
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    loadKitchenOrders();
                } catch (error) {
                    setToast({ message: "Error al revertir entrega", type: 'error' });
                }
            }
        });
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
                        {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                            onClick={() => {
                                if (activeTab === 'ready') showDeliverConfirm(order);
                                else if (activeTab === 'collected') showRevertConfirm(order);
                            }}
                            style={{ cursor: activeTab !== 'pending' ? 'pointer' : 'default' }}
                        >
                            <div className="kitchen-card-header">
                                <span className="ticket-number">#{order.id}</span>
                                <span className="ticket-time">
                                    <Clock size={16} /> 
                                    {formatTime(order.date)}
                                    {order.is_prepared && (
                                        <> | <span className="prepared-time">LISTO: {formatTime(order.prepared_at || order.updated_at)}</span></>
                                    )}
                                </span>
                            </div>
                            <div className="kitchen-card-body">
                                <div className="customer-info">
                                    <span className="customer-name">{order.customer_name || 'Particular'}</span>
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
                                {activeTab === 'pending' && (
                                    <button className="ready-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        handleReady(order.id);
                                    }}>
                                        <CheckCircle size={24} /> LISTO
                                    </button>
                                )}
                                {activeTab === 'ready' && (
                                    <div className="card-hint">
                                        <CheckCircle size={18} /> Pulsa para entregar
                                    </div>
                                )}
                                {activeTab === 'collected' && (
                                    <div className="card-hint revert">
                                        <ArrowLeftRight size={18} /> Pulsa para revertir
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default Kitchen;
