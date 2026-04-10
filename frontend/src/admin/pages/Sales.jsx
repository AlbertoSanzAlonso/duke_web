import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchMenuEntries, createSale, fetchSales, updateSale, deleteSale, bulkActionSales, fetchDashboardInsights, markSaleAsPrepared, markSaleAsDelivered, revertSalePrepared, revertSaleDelivery } from '../../services/api';
import { Trash2, Edit2, ChevronRight, CheckCircle2, MoreVertical, Plus, Minus, Search, ShoppingCart, Receipt, X, MapPin, Utensils, UtensilsCrossed, History } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import DigitalClock from '../components/DigitalClock';
import './Sales.css';

const Sales = () => {
    const location = useLocation();
    const isStandalone = location.pathname === '/tpv';
    const [viewMode, setViewMode] = useState('tpv'); // 'tpv' or 'pending'
    const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
    const [kitchenData, setKitchenData] = useState(null);
    const [isLoadingKitchen, setIsLoadingKitchen] = useState(false);
    const [actionOrder, setActionOrder] = useState(null);
    const [showDeliveredModal, setShowDeliveredModal] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let es = null;
        
        if (isStandalone) {
            // Connect SSE for standalone TPV
            const connectSSE = () => {
                const token = sessionStorage.getItem('duke_admin_token');
                const sseUrl = `${import.meta.env.VITE_API_URL || ''}/api/orders-stream/?token=${token ? token.trim() : ''}`;
                console.log("SSE Standalone TPV: Connecting to", sseUrl);
                es = new EventSource(sseUrl, { withCredentials: true });
                
                es.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'new_order' || data.type === 'order_updated') {
                            window.dispatchEvent(new CustomEvent('new-order-received', { detail: data }));
                        }
                    } catch (e) {}
                };

                es.onerror = () => {
                    if (es) {
                        es.close();
                        setTimeout(connectSSE, 10000); // Reconnect after 10s
                    }
                };
            };
            
            connectSSE();
        }
        
        return () => {
            if (es) es.close();
        };
    }, [isStandalone]);

    // Internal states from previous lines (matching current file content)
    const [menuEntries, setMenuEntries] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingTicketId, setDeletingTicketId] = useState(null);
    const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, action: null }); 
    const [toast, setToast] = useState(null); 
    
    // Ticket info
    const [customerName, setCustomerName] = useState('');
    const [saleNotes, setSaleNotes] = useState('');
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [isDelivery, setIsDelivery] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSaleId, setCurrentSaleId] = useState(null);
    const [ticketSnapshot, setTicketSnapshot] = useState(null);
    const [discountType, setDiscountType] = useState('fixed'); 
    const [discountValue, setDiscountValue] = useState('');

    // Individual Item Price Modal
    const [priceModal, setPriceModal] = useState({ isOpen: false, item: null });
    const [modalPriceType, setModalPriceType] = useState('direct'); 
    const [modalPriceValue, setModalPriceValue] = useState('');

    // List of pending tickets
    const [pendingTickets, setPendingTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState([]);

    // Delivery Calculation State
    const [isCalculating, setIsCalculating] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryRates, setDeliveryRates] = useState({ base: 1000, km: 200, max: 15 });

    useEffect(() => {
        loadData();

        // Real-time support
        const handleNewOrder = (event) => {
            console.log("Real-time: New order detected, refreshing pending tickets...");
            setToast({ message: "¡NUEVO PEDIDO RECIBIDO!", type: 'success' });
            loadData();
        };

        // Handle navigation state from Orders.jsx
        if (location.state?.pendingOrder) {
            console.log("Loading order from navigation state:", location.state.pendingOrder);
            loadPendingSale(location.state.pendingOrder);
        }

        window.addEventListener('new-order-received', handleNewOrder);
        return () => window.removeEventListener('new-order-received', handleNewOrder);
    }, [location.state]);
    
    const handleAction = async (orderId, type) => {
        try {
            if (type === 'DELETE') {
                if (!window.confirm("¿Eliminar este ticket permanentemente?")) return;
                await deleteSale(orderId);
            } else if (type === 'MARK_READY') {
                await markSaleAsPrepared(orderId);
            } else if (type === 'MARK_DELIVERED') {
                await markSaleAsDelivered(orderId);
            } else if (type === 'REVERT_PENDING') {
                await revertSalePrepared(orderId);
            } else if (type === 'REVERT_READY') {
                await revertSaleDelivery(orderId);
            }
            
            setToast({ message: "Operación realizada con éxito", type: 'success' });
            setActionOrder(null);
            loadKitchenSummary();
            loadData(); // Refresh list if something changed
        } catch (error) {
            setToast({ message: "Error al realizar la operación", type: 'error' });
        }
    };

    async function loadKitchenSummary() {
        setIsLoadingKitchen(true);
        try {
            const data = await fetchDashboardInsights();
            setKitchenData(data);
        } catch (error) {
            console.error("Error loading kitchen summary:", error);
            setToast({ message: "Error al cargar el estado de cocina", type: 'error' });
        } finally {
            setIsLoadingKitchen(false);
        }
    }

    const loadData = async () => {
        setLoading(true);
        try {
            const menuData = await fetchMenuEntries();
            setMenuEntries(menuData.filter(e => e.is_available));
            
            const salesData = await fetchSales();
            const todayStr = new Date().toISOString().split('T')[0];
            setPendingTickets(salesData.filter(s => s.status === 'PENDING' && s.date.includes(todayStr)));

            // Fetch delivery rates for automated calculation
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-rates/`);
                const dData = await response.json();
                if (dData) {
                    const r = Array.isArray(dData) ? dData[0] : dData;
                    if (r) {
                        setDeliveryRates({
                            base: parseFloat(r.base_price || 1000),
                            km: parseFloat(r.km_price || 200),
                            max: parseFloat(r.max_km || 15)
                        });
                    }
                }
            } catch (e) {
                console.error("Error loading delivery rates:", e);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDeliveryCost = async () => {
        const query = deliveryAddress || customerName;
        if (!query || query.length < 5) {
            setToast({ message: "Escribe una dirección en el campo o en el nombre del cliente.", type: 'error' });
            return;
        }

        setIsCalculating(true);
        try {
            // Search localized in San Juan, Argentina as per AGENTS.md
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},+San+Juan,+Argentina&format=json&limit=1`,
                { headers: { 'User-Agent': 'DukeBurgerApp/1.0' } }
            );
            const data = await response.json();

            if (data && data[0]) {
                const destLat = parseFloat(data[0].lat);
                const destLon = parseFloat(data[0].lon);
                const originLat = -31.5375; 
                const originLon = -68.5364;

                const R = 6371; // Earth radius in KM
                const dLat = (destLat - originLat) * Math.PI / 180;
                const dLon = (destLon - originLon) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;

                if (distance > deliveryRates.max) {
                    setToast({ 
                        message: `Distancia excedida: ${distance.toFixed(1)}km. El límite es de ${deliveryRates.max}km.`, 
                        type: 'error' 
                    });
                    return;
                }

                let cost = distance < 1 ? deliveryRates.base : (distance * deliveryRates.km);
                // Round up to next $100 as per AGENTS.md rule
                cost = Math.max(deliveryRates.base, Math.ceil(cost / 100) * 100);

                setDeliveryCost(cost);
                setIsDelivery(true);
                
                // If it's a new name, suggest it
                if (!customerName || (customerName.length < 10 && data[0].display_name.includes(customerName))) {
                    const cleanName = data[0].display_name.split(',').slice(0, 2).join(', ');
                    setCustomerName(cleanName);
                }

                setToast({ 
                    message: `Envío calculado: $${cost.toLocaleString('es-AR')} (${distance.toFixed(1)}km)`, 
                    type: 'success' 
                });
            } else {
                setToast({ message: "No se encontró la dirección. Intenta ser más específico (Calle y Nro).", type: 'error' });
            }
        } catch (error) {
            console.error("Nominatim error:", error);
            setToast({ message: "Error al calcular distancia (Nominatim).", type: 'error' });
        } finally {
            setIsCalculating(false);
        }
    };

    const categories = useMemo(() => ["Todas", ...new Set(menuEntries.map(e => e.category))], [menuEntries]);

    const addToCart = useCallback((entry) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.menu_entry === entry.id);
            if (existing) {
                return prevCart.map(item =>
                    item.menu_entry === entry.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { 
                menu_entry: entry.id, 
                name: entry.product.name, 
                price: parseFloat(entry.price), 
                originalPrice: parseFloat(entry.price),
                quantity: 1 
            }];
        });
    }, []);

    const removeFromCart = useCallback((id) => {
        setCart(prevCart => prevCart.filter(item => item.menu_entry !== id));
    }, []);

    const updateQuantity = useCallback((id, delta) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.menu_entry === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    }, []);

    const updatePrice = useCallback((id, newPrice) => {
        setCart(prevCart => prevCart.map(item => 
            item.menu_entry === id ? { ...item, price: parseFloat(newPrice) || 0 } : item
        ));
    }, []);

    const handleApplyItemPrice = () => {
        if (!priceModal.item) return;
        const currentItem = priceModal.item;
        let finalPrice = parseFloat(modalPriceValue) || 0;
        
        if (modalPriceType === 'fixed') {
            finalPrice = Math.max(0, currentItem.originalPrice - (parseFloat(modalPriceValue) || 0));
        } else if (modalPriceType === 'percent') {
            finalPrice = Math.max(0, currentItem.originalPrice * (1 - (parseFloat(modalPriceValue || 0) / 100)));
        }
        
        updatePrice(currentItem.menu_entry, finalPrice);
        setPriceModal({ isOpen: false, item: null });
        setModalPriceValue('');
    };

    const openPriceModal = (item) => {
        // Find if we already have the original price stored or use current
        const originalPrice = item.originalPrice || item.price;
        setPriceModal({ 
            isOpen: true, 
            item: { ...item, originalPrice } 
        });
        setModalPriceValue(''); // Clear it as requested
        setModalPriceType('direct');
    };

    const { totalOriginalPrice, subtotalWithItemAdjustments, totalSavings, total, totalItems } = useMemo(() => {
        const orig = cart.reduce((acc, item) => acc + (parseFloat(item.originalPrice || item.price) * item.quantity), 0);
        const sub = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
        const globDiscount = discountType === 'percent' 
            ? (sub * (parseFloat(discountValue || 0) / 100))
            : parseFloat(discountValue || 0);
        
        const sav = (orig - sub) + globDiscount;
        const tot = Math.max(0, orig - sav + (isDelivery ? parseFloat(deliveryCost || 0) : 0));
        const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

        return {
            totalOriginalPrice: orig,
            subtotalWithItemAdjustments: sub,
            totalSavings: sav,
            total: tot,
            totalItems: itemsCount
        };
    }, [cart, discountType, discountValue, isDelivery, deliveryCost]);

    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const toggleTicket = () => setIsTicketOpen(!isTicketOpen);

    const resetCart = () => {
        setCart([]);
        setCustomerName('');
        setSaleNotes('');
        setDeliveryCost(0);
        setIsDelivery(false);
        setCurrentSaleId(null);
        setTicketSnapshot(null);
        setIsTicketOpen(false);
        setDiscountValue('');
        setDiscountType('fixed');
    };

    const handleSaveTicket = async (status = 'COMPLETED') => {
        if (!customerName.trim()) {
            setToast({ message: "El nombre del cliente es obligatorio para identificar el ticket.", type: 'error' });
            return;
        }
        setIsSaving(true);
        try {
            let currentTicketObj = pendingTickets.find(t => t.id === currentSaleId);
            
            // If updating, ideally refresh the latest state from the server to avoid stale split logic
            if (currentSaleId) {
                try {
                    const allSales = await fetchSales();
                    currentTicketObj = allSales.find(s => s.id === currentSaleId);
                } catch (e) {
                    console.error("Failed to refresh ticket for split logic", e);
                }
            }

            if (currentSaleId && currentTicketObj) {
                const oldCart = ticketSnapshot ? JSON.parse(ticketSnapshot).cart : [];
                const addedItems = [];
                const oldTicketItemsToKeep = [];
                
                cart.forEach(cItem => {
                    const oldItem = oldCart.find(o => o.id === cItem.menu_entry);
                    const oldQty = oldItem ? oldItem.q : 0;
                    
                    // Added portion
                    if (cItem.quantity > oldQty) {
                        addedItems.push({
                            menu_entry: cItem.menu_entry,
                            quantity: cItem.quantity - oldQty,
                            price_at_sale: cItem.price
                        });
                    }
                    
                    // Original portion (accounting for potential reductions)
                    const keepQty = Math.min(cItem.quantity, oldQty);
                    if (keepQty > 0) {
                        oldTicketItemsToKeep.push({
                            menu_entry: cItem.menu_entry,
                            quantity: keepQty,
                            price_at_sale: cItem.price
                        });
                    }
                });

                if (addedItems.length > 0) {
                    // Create Ampliacion
                    const amplTotal = addedItems.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0);
                    const amplData = {
                        total_amount: amplTotal,
                        status: status,
                        customer_name: `${customerName} (Ampl. #${currentSaleId})`,
                        table_number: isDelivery ? `ENVIO: $${deliveryCost}` : "", 
                        delivery_cost: 0,
                        notes: saleNotes,
                        items: addedItems
                    };
                    await createSale(amplData);

                    // Re-save original ticket with retained items to adjust cost if needed
                    // Important: We keep total_amount for the original part, plus delivery if it existed
                    const oldTotal = oldTicketItemsToKeep.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0);
                    const oldSaleData = {
                        total_amount: oldTotal + (isDelivery ? deliveryCost : 0),
                        status: currentTicketObj.status, // Keep original status
                        customer_name: customerName,
                        table_number: isDelivery ? `ENVIO: $${deliveryCost}` : "", 
                        delivery_cost: isDelivery ? deliveryCost : 0,
                        notes: saleNotes,
                        items: oldTicketItemsToKeep
                    };
                    await updateSale(currentSaleId, oldSaleData);
                    
                    setToast({ message: "¡Ampliación creada y enviada a cocina!", type: 'success' });
                    resetCart();
                    loadData();
                    setIsSaving(false);
                    return;
                }
            }

            const saleData = {
                total_amount: total,
                status: status,
                customer_name: customerName,
                table_number: isDelivery ? `ENVIO: $${deliveryCost}` : "", 
                delivery_cost: isDelivery ? deliveryCost : 0,
                notes: saleNotes,
                items: cart.map(item => ({
                    menu_entry: item.menu_entry,
                    quantity: item.quantity,
                    price_at_sale: item.price
                }))
            };

            if (currentSaleId) {
                await updateSale(currentSaleId, saleData);
            } else {
                await createSale(saleData);
            }
            
            setToast({ 
                message: status === 'PENDING' ? "¡Ticket enviado a cocina! (Pendiente de pago)" : "¡Venta cobrada con éxito!", 
                type: 'success' 
            });
            resetCart();
            loadData(); // Refresh pending tickets
        } catch (error) {
            setToast({ message: "Error al procesar la operación", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const loadPendingSale = (ticket) => {
        const loadedCart = ticket.items.map(item => ({
            menu_entry: item.menu_entry,
            name: item.entry_name,
            price: parseFloat(item.price_at_sale),
            originalPrice: parseFloat(item.original_price || item.price_at_sale),
            quantity: item.quantity
        }));
        
        setCart(loadedCart);
        setCustomerName(ticket.customer_name || '');
        setSaleNotes(ticket.notes || '');
        setDeliveryCost(parseFloat(ticket.delivery_cost || 0));
        setIsDelivery(parseFloat(ticket.delivery_cost || 0) > 0);
        setCurrentSaleId(ticket.id);
        
        // Tracking state to detect if user modified anything
        setTicketSnapshot(JSON.stringify({
            cart: loadedCart.map(item => ({ id: item.menu_entry, q: item.quantity, p: item.price })),
            name: (ticket.customer_name || '').trim(),
            notes: (ticket.notes || '').trim(),
            delCost: parseFloat(ticket.delivery_cost || 0),
            isDel: parseFloat(ticket.delivery_cost || 0) > 0
        }));
        
        setViewMode('tpv');
        setIsTicketOpen(true);
    };

    const filteredMenu = useMemo(() => {
        return menuEntries.filter(e => {
            const matchesCategory = selectedCategory === "Todas" || e.category === selectedCategory;
            const matchesSearch = !searchTerm || 
                (e.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.category || "").toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [menuEntries, selectedCategory, searchTerm]);

    const handleDeleteTicket = async (id) => {
        setIsSaving(true);
        try {
            await deleteSale(id);
            setToast({ message: "Ticket eliminado correctamente.", type: 'success' });
            setDeletingTicketId(null);
            setSelectedTickets(prev => prev.filter(tid => tid !== id));
            loadData();
        } catch (error) {
            setToast({ message: "Error al eliminar ticket.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkAction = (action) => {
        if (selectedTickets.length === 0) return;
        setBulkConfirm({ isOpen: true, action });
    };

    const executeBulkAction = async () => {
        const { action } = bulkConfirm;
        setBulkConfirm({ isOpen: false, action: null });
        setIsSaving(true);
        try {
            const res = await bulkActionSales(selectedTickets, action);
            setToast({ message: res.message, type: 'success' });
            setSelectedTickets([]);
            loadData();
        } catch (error) {
            setToast({ message: "Error en acción masiva: " + error.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTicketSelection = (id, e) => {
        e.stopPropagation();
        setSelectedTickets(prev => 
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="pos-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {isStandalone && (
                <header className="kitchen-header" style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    marginBottom: '20px', 
                    paddingBottom: '15px',
                    borderBottom: '2px solid #333'
                }}>
                    <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h1 style={{ 
                            margin: 0, 
                            fontFamily: "'Bebas Neue', sans-serif", 
                            fontSize: '2.5rem', 
                            letterSpacing: '2px',
                            color: 'var(--admin-primary, #f03e3e)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '15px' 
                        }}>
                            <ShoppingCart size={40} /> TPV DUKE
                        </h1>
                        <div className="kitchen-clock">
                            <DigitalClock />
                        </div>
                    </div>
                </header>
            )}

            {/* FAB para móviles */}
            {/* FAB para móviles - Simplificado */}
            <button className={`pos-fab ${isTicketOpen ? 'hidden' : ''}`} onClick={toggleTicket}>
                <div className="fab-count-badge">
                    {totalItems} <small>ART</small>
                </div>
                <div className="fab-price-badge">
                    ${total.toLocaleString('es-AR')}
                </div>
            </button>

            {/* Selector de Modo */}
            <div className="pos-view-selector">
                <button 
                    className={viewMode === 'tpv' ? 'active' : ''} 
                    onClick={() => setViewMode('tpv')}
                >
                    NUEVA VENTA
                </button>
                <button 
                    className={viewMode === 'pending' ? 'active' : ''} 
                    onClick={() => setViewMode('pending')}
                >
                    TICKETS PENDIENTES ({pendingTickets.length})
                </button>
                <button 
                    className={isKitchenModalOpen ? 'active' : ''}
                    onClick={() => {
                        loadKitchenSummary();
                        setIsKitchenModalOpen(true);
                    }}
                >
                    ESTADO COCINA
                </button>
            </div>

            {viewMode === 'tpv' ? (
                <>
                    <div className="pos-main">
                        <div className="pos-left-content">
                            <div className="pos-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="category-tabs" style={{ display: 'flex', overflowX: 'auto', paddingBottom: '5px', gap: '8px' }}>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat} 
                                            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="search-bar" style={{ position: 'relative', width: '100%' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar producto o categoría..." 
                                        defaultValue={searchTerm}
                                        onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                                        style={{ padding: '12px 15px 12px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.95rem', width: '100%', background: '#fff' }}
                                    />
                                </div>
                            </div>

                            <div className="pos-products-grid">
                            {filteredMenu.map(entry => (
                                <div 
                                    key={entry.id} 
                                    className="pos-product-card"
                                    onClick={() => addToCart(entry)}
                                >
                                    <div className="pos-product-img-container">
                                        {entry.product.image ? (
                                            <img src={entry.product.image} alt={entry.product.name} />
                                        ) : (
                                            <div className="no-img-placeholder">🍔</div>
                                        )}
                                    </div>
                                    <div className="pos-product-info">
                                        <h3>{entry.product.name}</h3>
                                        <span className="pos-price">${parseFloat(entry.price).toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>

                        {/* Sidebar del Ticket */}
                        <div className={`pos-ticket-sidebar ${isTicketOpen ? 'open' : ''}`}>
                            <div className="ticket-header" style={{ padding: '15px 12px', background: '#333', color: '#fff' }}>
                                {window.innerWidth <= 992 && (
                                    <button className="close-ticket-btn" onClick={() => setIsTicketOpen(false)} style={{ color: '#fff' }}>
                                        <X size={36} strokeWidth={3} />
                                    </button>
                                )}
                                <h2 style={{ fontSize: '1rem', fontWeight: '900', letterSpacing: '1px', flex: 1, textAlign: 'center' }}>
                                    {currentSaleId ? `EDITANDO #${currentSaleId}` : "TICKET ACTUAL"}
                                </h2>
                                <button className="clear-btn" onClick={resetCart} style={{ fontSize: '0.75rem', color: '#ff4d4d' }}>VACIAR</button>
                            </div>
                            
                            <div className="ticket-meta" style={{ padding: '8px', gap: '6px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Cliente / Nombre * (Obligatorio)" 
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className={!customerName && cart.length > 0 ? "input-required" : ""}
                                    style={{ padding: '8px', fontSize: '0.8rem', height: '32px' }}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Anotaciones (Opcional)" 
                                    value={saleNotes}
                                    onChange={e => setSaleNotes(e.target.value)}
                                    style={{ padding: '8px', fontSize: '0.8rem', height: '32px' }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', padding: '6px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isDelivery} 
                                                onChange={(e) => setIsDelivery(e.target.checked)} 
                                            />
                                            ENVÍO
                                        </label>
                                        
                                        {isDelivery && (
                                            <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                                                <div style={{ flex: 1, position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#999' }}>$</span>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Costo"
                                                        step="100"
                                                        className="no-arrows-input"
                                                        value={deliveryCost}
                                                        onChange={e => setDeliveryCost(e.target.value)}
                                                        style={{ paddingLeft: '18px', height: '28px', width: '100%', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={calculateDeliveryCost}
                                                    disabled={isCalculating}
                                                    style={{ 
                                                        padding: '0 8px', 
                                                        height: '28px', 
                                                        background: '#ae3ec9', 
                                                        color: 'white', 
                                                        border: 'none', 
                                                        borderRadius: '4px', 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    {isCalculating ? '...' : <MapPin size={12} />}
                                                    CALCULAR
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isDelivery && (
                                        <input 
                                            type="text"
                                            placeholder="Dirección para calcular (Calle y Nro)..."
                                            value={deliveryAddress}
                                            onChange={e => setDeliveryAddress(e.target.value)}
                                            style={{ width: '100%', height: '26px', fontSize: '0.7rem', padding: '0 8px', borderRadius: '4px', border: '1px solid #eee' }}
                                            onKeyDown={e => e.key === 'Enter' && calculateDeliveryCost()}
                                        />
                                    )}
                                </div>
                            </div>

            <div className="ticket-items" style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
                                {cart.length === 0 ? (
                                    <div className="empty-cart-msg" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>No hay productos en el ticket</div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.menu_entry} className="ticket-item" style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
                                            <div className="item-details" style={{ marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span className="item-name" style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.name}</span>
                                                    {parseFloat(item.price) < parseFloat(item.originalPrice) && (
                                                        <span style={{ fontSize: '0.7rem', color: '#f03e3e', fontWeight: 'bold' }}>
                                                            Desc: −${(parseFloat(item.originalPrice) - parseFloat(item.price)).toLocaleString('es-AR')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <span className="item-subtotal" style={{ fontSize: '0.85rem', fontWeight: '900' }}>
                                                        ${(parseFloat(item.price) * item.quantity).toLocaleString('es-AR')}
                                                    </span>
                                                    {parseFloat(item.price) < parseFloat(item.originalPrice) && (
                                                        <span style={{ fontSize: '0.7rem', color: '#999', textDecoration: 'line-through' }}>
                                                            ${(parseFloat(item.originalPrice) * item.quantity).toLocaleString('es-AR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="item-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between', marginTop: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', background: '#f1f3f5', borderRadius: '4px' }}>
                                                    <button onClick={() => updateQuantity(item.menu_entry, -1)} style={{ background: 'transparent', border: 'none', padding: '1px 6px', fontSize: '1rem', cursor: 'pointer' }}>−</button>
                                                    <span className="item-qty" style={{ fontWeight: '800', width: '15px', textAlign: 'center', fontSize: '0.75rem' }}>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.menu_entry, 1)} style={{ background: 'transparent', border: 'none', padding: '1px 6px', fontSize: '1rem', cursor: 'pointer' }}>+</button>
                                                </div>
                                                
                                                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                                    <button 
                                                        onClick={() => openPriceModal(item)}
                                                        style={{ padding: '3px 6px', background: '#333', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.6rem'}}
                                                    >
                                                        <Edit2 size={10} />
                                                    </button>
                                                    <button 
                                                        onClick={() => updatePrice(item.menu_entry, 0)}
                                                        style={{ padding: '3px 6px', background: '#fa5252', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.65rem'}}
                                                    >
                                                        🎁
                                                    </button>
                                                    <button onClick={() => removeFromCart(item.menu_entry)} style={{ marginLeft: '4px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'}}>×</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="ticket-footer" style={{ padding: '8px 12px', borderTop: '2px solid #333', background: '#fff' }}>
                                <div className="total-row" style={{ marginBottom: '0px', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                    <span style={{ color: '#999', fontWeight: 'bold' }}>SUBTOTAL:</span>
                                    <span style={{ color: '#666' }}>${totalOriginalPrice.toLocaleString('es-AR')}</span>
                                </div>

                                {totalSavings > 0 && (
                                    <div className="total-row" style={{ marginBottom: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#f03e3e' }}>
                                        <span style={{ fontWeight: 'bold' }}>DESCUENTO ({((totalSavings / totalOriginalPrice) * 100).toFixed(1)}%):</span>
                                        <span style={{ fontWeight: '800' }}>− ${totalSavings.toLocaleString('es-AR')}</span>
                                    </div>
                                )}

                                <div className="discount-controls" style={{ background: '#f8f9fa', padding: '4px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <select 
                                            value={discountType} 
                                            onChange={e => setDiscountType(e.target.value)}
                                            style={{ padding: '2px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.75rem' }}
                                        >
                                            <option value="fixed">$ DESC</option>
                                            <option value="percent">% DESC</option>
                                        </select>
                                        <input 
                                            type="number" 
                                            placeholder="Valor"
                                            value={discountValue || ''}
                                            onChange={e => setDiscountValue(e.target.value)}
                                            className="no-arrows-input"
                                            style={{ flex: 1, padding: '2px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </div>

                                {isDelivery && (
                                    <div className="total-row" style={{ color: '#ae3ec9', fontSize: '0.8rem', marginBottom: '4px' }}>
                                        <span>ENVÍO:</span>
                                        <span>+ ${parseFloat(deliveryCost || 0).toLocaleString('es-AR')}</span>
                                    </div>
                                )}
                                
                                <div className="total-row" style={{ borderTop: '2.5px solid #333', paddingTop: '6px', marginTop: '4px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: '900' }}>TOTAL:</span>
                                    <span className="total-price" style={{ fontSize: '1.4rem', fontWeight: '900' }}>${total.toLocaleString('es-AR')}</span>
                                </div>
                                
                                <div className="pos-actions-grid" style={{ gap: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                    {(() => {
                                        const currentSnapshot = JSON.stringify({
                                            cart: cart.map(item => ({ id: item.menu_entry, q: item.quantity, p: item.price })),
                                            name: customerName.trim(),
                                            notes: saleNotes.trim(),
                                            delCost: parseFloat(deliveryCost || 0),
                                            isDel: isDelivery
                                        });
                                        const hasModifications = true; // Por defecto
                                        const disableMarchar = cart.length === 0 || isSaving || (currentSaleId && ticketSnapshot === currentSnapshot);
                                        
                                        return (
                                            <button 
                                                className="pending-btn" 
                                                disabled={disableMarchar}
                                                onClick={() => handleSaveTicket('PENDING')}
                                                style={{ 
                                                    padding: '8px', 
                                                    fontSize: '0.85rem', 
                                                    background: disableMarchar ? '#ccc' : '#ff922b', 
                                                    border: 'none', 
                                                    borderRadius: '6px', 
                                                    cursor: disableMarchar ? 'not-allowed' : 'pointer', 
                                                    color: 'white', 
                                                    fontWeight: '800' 
                                                }}
                                            >
                                                {currentSaleId && disableMarchar ? 'MARCHANDO...' : 'MARCHAR A COCINA'}
                                                <div style={{fontSize: '0.65rem', fontWeight: '500'}}>
                                                    {currentSaleId && disableMarchar ? 'SIN MODIFICAR' : (currentSaleId ? 'ACTUALIZAR PEDIDO' : 'DEJAR PENDIENTE')}
                                                </div>
                                            </button>
                                        );
                                    })()}
                                    <button 
                                        className="checkout-btn" 
                                        disabled={cart.length === 0 || isSaving}
                                        onClick={() => handleSaveTicket('COMPLETED')}
                                        style={{ padding: '8px', fontSize: '0.85rem', background: '#28a745', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: '800' }}
                                    >
                                        COBRAR
                                        <div style={{fontSize: '0.65rem', fontWeight: '500'}}>FINALIZAR TICKET</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="pending-list-container">
                    {selectedTickets.length > 0 && (
                        <div className="bulk-actions-bar">
                            <div style={{ fontWeight: 'bold' }}>{selectedTickets.length} Seleccionados</div>
                            <div className="bulk-buttons-group">
                                <button className="bulk-btn-del" onClick={() => handleBulkAction('DELETE')}>
                                    ELIMINAR
                                </button>
                                <button className="bulk-btn-pay" onClick={() => handleBulkAction('COMPLETE')}>
                                    COBRAR TODO
                                </button>
                                <button className="bulk-btn-cancel" onClick={() => setSelectedTickets([])}>
                                    CANCELAR
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="pending-grid">
                        {pendingTickets.length === 0 ? (
                            <div className="no-pending-msg">No hay tickets pendientes</div>
                        ) : (
                            pendingTickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    className={`pending-ticket-card ${selectedTickets.includes(ticket.id) ? 'selected' : ''}`} 
                                    onClick={() => loadPendingSale(ticket)}
                                    style={{ 
                                        position: 'relative', 
                                        border: selectedTickets.includes(ticket.id) ? '2px solid #5c7cfa' : '1px solid #eee',
                                        background: selectedTickets.includes(ticket.id) ? '#edf2ff' : '#fff'
                                    }}
                                >
                                    <div 
                                        onClick={(e) => toggleTicketSelection(ticket.id, e)}
                                        style={{ 
                                            position: 'absolute', top: '15px', left: '15px', 
                                            width: '24px', height: '24px', 
                                            borderRadius: '6px', border: '2px solid #ddd',
                                            background: selectedTickets.includes(ticket.id) ? '#5c7cfa' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', zIndex: 5,
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {selectedTickets.includes(ticket.id) && <span style={{ color: 'white', fontSize: '14px', fontWeight: '900' }}>✓</span>}
                                    </div>

                                    <div className="pending-info" style={{ paddingLeft: '35px' }}>
                                        <span className="pending-id">#{ticket.id}</span>
                                        <span className="pending-date">{new Date(ticket.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}</span>
                                    </div>
                                    <div className="pending-customer" style={{ paddingLeft: '35px' }}>
                                        <strong>{ticket.customer_name || 'Sin nombre'}</strong>
                                        {ticket.customer_name?.includes('(Ampl. #') && (
                                            <span style={{ marginLeft: '10px', padding: '2px 8px', background: '#ff922b', color: '#fff', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900' }}>AMPLIACIÓN</span>
                                        )}
                                        {ticket.table_number && <span className="table-tag">{ticket.table_number}</span>}
                                    </div>
                                    <div className="pending-items-summary" style={{ paddingLeft: '35px' }}>
                                        {ticket.items.reduce((acc, item) => acc + item.quantity, 0)} productos
                                    </div>
                                    <div className="pending-total" style={{ paddingLeft: '35px' }}>
                                        ${parseFloat(ticket.total_amount).toLocaleString('es-AR')}
                                    </div>
                                    <div className="pending-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                        <button className="load-btn" onClick={() => loadPendingSale(ticket)}>ABRIR</button>
                                        <button 
                                            className="delete-pending-btn" 
                                            onClick={(e) => { e.stopPropagation(); setDeletingTicketId(ticket.id); }}
                                            style={{ width: '100%', padding: '0.8rem', background: '#f03e3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            ELIMINAR
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {deletingTicketId && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' }}>
                    <div className="admin-modal" style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '15px', overflow: 'hidden', textAlign: 'center' }}>
                        <div style={{ padding: '30px' }}>
                            <div style={{ width: '60px', height: '60px', background: '#fff5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f03e3e', fontSize: '2rem' }}>!</div>
                            <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>¿Eliminar Ticket #{deletingTicketId}?</h3>
                            <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>Esta acción no se puede deshacer. Los datos del ticket se perderán definitivamente.</p>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setDeletingTicketId(null)}
                                    style={{ flex: 1, padding: '15px', background: '#f8f9fa', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    onClick={() => handleDeleteTicket(deletingTicketId)}
                                    style={{ flex: 1, padding: '15px', background: '#f03e3e', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#fff' }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'ELIMINANDO...' : 'SÍ, ELIMINAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions Confirmation Modal */}
            {bulkConfirm.isOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7000, padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div className="admin-card" style={{ width: '100%', maxWidth: '400px', border: '1px solid #333' }}>
                        <div style={{ padding: '30px', textAlign: 'center' }}>
                            <div style={{ 
                                width: '60px', height: '60px', 
                                background: bulkConfirm.action === 'DELETE' ? '#fff5f5' : '#ebfbee', 
                                borderRadius: '50%', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', margin: '0 auto 20px', 
                                color: bulkConfirm.action === 'DELETE' ? '#f03e3e' : '#2b8a3e', 
                                fontSize: '2rem' 
                            }}>
                                {bulkConfirm.action === 'DELETE' ? '⚠️' : '💵'}
                            </div>
                            <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>
                                {bulkConfirm.action === 'DELETE' ? 'Eliminar Selección' : 'Cobrar Selección'}
                            </h3>
                            <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
                                {bulkConfirm.action === 'DELETE' 
                                    ? `¿Deseas eliminar permanentemente los ${selectedTickets.length} tickets seleccionados?` 
                                    : `¿Deseas cobrar por caja los ${selectedTickets.length} tickets seleccionados?`
                                }
                            </p>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setBulkConfirm({ isOpen: false, action: null })}
                                    style={{ flex: 1, padding: '15px', background: '#f8f9fa', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    onClick={executeBulkAction}
                                    style={{ 
                                        flex: 2, padding: '15px', 
                                        background: bulkConfirm.action === 'DELETE' ? '#f03e3e' : '#2b8a3e', 
                                        border: 'none', borderRadius: '10px', fontWeight: 'bold', 
                                        cursor: 'pointer', color: '#fff' 
                                    }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'PROCESANDO...' : (bulkConfirm.action === 'DELETE' ? 'SÍ, ELIMINAR' : 'SÍ, COBRAR')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Price Adjustment Modal */}
            {priceModal.isOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '20px' }}>
                    <div className="admin-modal" style={{ background: '#fff', width: '100%', maxWidth: '350px', borderRadius: '15px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Ajustar Precio</h3>
                            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '0.9rem' }}>{priceModal.item?.name}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="modal-price-selector" style={{ display: 'flex', gap: '5px' }}>
                                    {[
                                        { id: 'direct', label: 'PRECIO FIN' },
                                        { id: 'fixed', label: '$ DESC' },
                                        { id: 'percent', label: '% DESC' }
                                    ].map(type => (
                                        <button 
                                            key={type.id}
                                            className={`mode-selector-btn ${modalPriceType === type.id ? 'active' : ''}`}
                                            onClick={() => setModalPriceType(type.id)}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <span style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50.5%', 
                                        transform: 'translateY(-50%)', 
                                        fontWeight: '900', 
                                        color: '#333',
                                        fontSize: '1.4rem',
                                        zIndex: 5
                                    }}>
                                        {modalPriceType === 'percent' ? '%' : '$'}
                                    </span>
                                    <input 
                                        type="number" 
                                        autoFocus
                                        value={modalPriceValue}
                                        onChange={e => setModalPriceValue(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '15px 15px 15px 48px', 
                                            borderRadius: '12px', 
                                            border: '2px solid #333', 
                                            fontSize: '1.4rem', 
                                            fontWeight: '900',
                                            background: '#ffffff',
                                            outline: 'none'
                                        }}
                                        placeholder="0"
                                        className="no-arrows-input modal-price-input"
                                    />
                                </div>

                                {modalPriceType !== 'direct' && (
                                    <div style={{ background: '#fff5f5', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Precio resultante: </span>
                                        <strong style={{ fontSize: '1rem', color: '#f03e3e' }}>
                                            ${(modalPriceType === 'fixed' 
                                                ? Math.max(0, priceModal.item.originalPrice - (parseFloat(modalPriceValue) || 0))
                                                : Math.max(0, priceModal.item.originalPrice * (1 - (parseFloat(modalPriceValue || 0) / 100)))
                                            ).toLocaleString('es-AR')}
                                        </strong>
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        onClick={() => setPriceModal({ isOpen: false, item: null })}
                                        style={{ flex: 1, padding: '12px', background: '#f8f9fa', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        CANCELAR
                                    </button>
                                    <button 
                                        onClick={handleApplyItemPrice}
                                        style={{ flex: 1.5, padding: '12px', background: '#28a745', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#fff' }}
                                    >
                                        APLICAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Estado de Cocina (Reutilizado del Dashboard) */}
            {isKitchenModalOpen && (
                <div className="modal-overlay" onClick={() => setIsKitchenModalOpen(false)} style={{ zIndex: 5000 }}>
                    <div className="admin-card modal-content" onClick={e => e.stopPropagation()} style={{ 
                        width: '95%', maxWidth: '550px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', 
                        padding: '0', overflow: 'hidden', borderRadius: '20px', position: 'relative', background: '#fff'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333', background: '#1a1b1e', color: '#fff' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', color: '#fff' }}>
                                <Utensils color="var(--admin-primary)" /> Control de Cocina
                            </h2>
                            <button onClick={() => setIsKitchenModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#fff' }}>×</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fff' }}>
                            {isLoadingKitchen ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#333' }}>Cargando estado...</div>
                            ) : kitchenData?.today_sales ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                        <div className="stat-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>EN PREPARACIÓN</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#333' }}>{kitchenData.today_sales.kitchen_pending}</div>
                                        </div>
                                        <div className="stat-card" style={{ background: '#ebfbee', padding: '15px', borderRadius: '12px', border: '1px solid #ebfbee' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#2b8a3e', fontWeight: 'bold' }}>LISTOS HOY</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2b8a3e' }}>{kitchenData.today_sales.kitchen_ready}</div>
                                        </div>
                                    </div>

                                    <div className="kitchen-lists-split">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#2b8a3e', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                Pedidos Listos
                                            </h4>
                                            <button onClick={() => { setIsKitchenModalOpen(false); setShowDeliveredModal(true); }} style={{ background: '#f1f3f5', border: 'none', fontSize: '0.7rem', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}>
                                                VER RECOGIDOS ({kitchenData.today_sales.kitchen_delivered})
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {kitchenData.today_sales.kitchen_ready_list.length === 0 ? (
                                                <p style={{ color: '#999', fontSize: '0.85rem' }}>No hay pedidos listos</p>
                                            ) : (
                                                kitchenData.today_sales.kitchen_ready_list.map(order => (
                                                    <div key={order.id} onClick={() => setActionOrder({...order, currentStatus: 'READY'})} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '4px solid #40c057', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        <span style={{ color: '#333' }}><strong>#{order.id}</strong> {order.customer}</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#666' }}>✅ {new Date(order.updated_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#e03131', marginTop: '20px', marginBottom: '10px' }}>En Cocción</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {kitchenData.today_sales.kitchen_pending_list.length === 0 ? (
                                                <p style={{ color: '#999', fontSize: '0.85rem' }}>No hay pedidos en preparación</p>
                                            ) : (
                                                kitchenData.today_sales.kitchen_pending_list.map(order => (
                                                    <div key={order.id} onClick={() => setActionOrder({...order, currentStatus: 'PENDING'})} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '4px solid #f03e3e', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        <span style={{ color: '#333' }}><strong>#{order.id}</strong> {order.customer}</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#e03131' }}>⏲️ {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: '#333' }}>No se pudo cargar la información operativa.</p>
                            )}
                        </div>

                        {actionOrder && (
                            <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 6000 }} onClick={() => setActionOrder(null)}>
                                <div className="admin-card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '350px', padding: '0', borderRadius: '15px', overflow: 'hidden', background: '#fff' }}>
                                    <div style={{ padding: '20px', background: '#1a1b1e', color: '#fff' }}>
                                        <h3 style={{ margin: 0, color: '#fff' }}>Pedido #{actionOrder.id}</h3>
                                        <p style={{ margin: '5px 0 0', opacity: 0.8, color: '#fff' }}>{actionOrder.customer}</p>
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
                                        <button onClick={() => setActionOrder(null)} style={{ padding: '15px', background: '#f1f3f5', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}>CANCELAR</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '20px', borderTop: '1px solid #eee', textAlign: 'center', background: '#fff' }}>
                            <button className="confirm-btn" style={{ width: '100%' }} onClick={() => setIsKitchenModalOpen(false)}>CERRAR</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeliveredModal && (
                <div className="modal-overlay" onClick={() => setShowDeliveredModal(false)} style={{ zIndex: 5000 }}>
                    <div className="admin-card modal-content" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', borderRadius: '20px', background: '#fff' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>📦 Recogidos (Hoy)</h3>
                            <button onClick={() => setShowDeliveredModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#333' }}>×</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fff' }}>
                            {kitchenData?.today_sales?.kitchen_delivered_list?.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#999' }}>Ningún pedido recogido hoy todavía.</p>
                            ) : (
                                kitchenData?.today_sales?.kitchen_delivered_list?.map(order => (
                                    <div key={order.id} onClick={() => setActionOrder({...order, currentStatus: 'COLLECTED'})} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', border: '1px solid #eee' }}>
                                        <span style={{ color: '#333' }}><strong>#{order.id}</strong> {order.customer}</span>
                                        <span style={{ fontSize: '0.7rem', color: '#666' }}>⏲️ {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid #eee', background: '#fff' }}>
                            <button onClick={() => { setShowDeliveredModal(false); setIsKitchenModalOpen(true); }} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', background: '#f8f9fa', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}>VOLVER AL CONTROL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
