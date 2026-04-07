import React, { useState, useEffect } from 'react';
import { fetchSupplierOrders, createSupplierOrder, fetchInventory, createInventoryItem } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Truck, Plus, History, Trash2, ShoppingCart, Search } from 'lucide-react';
import './Accounting.css';

const SupplierOrders = () => {
    const [orders, setOrders] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Order draft state
    const [supplierName, setSupplierName] = useState('');
    const [orderItems, setOrderItems] = useState([]); // Array of { item_id, quantity, cost, name }

    // Manual item add state
    const [selectedItemId, setSelectedItemId] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemCost, setItemCost] = useState('');

    // New Item Flow
    const [isAddingNewItem, setIsAddingNewItem] = useState(false);
    const [newItemData, setNewItemData] = useState({ name: '', unit: 'unidades', category: 'Otros' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, inventoryData] = await Promise.all([
                fetchSupplierOrders(),
                fetchInventory()
            ]);
            setOrders(ordersData);
            setInventoryItems(inventoryData);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const addItemToOrder = async () => {
        if (isAddingNewItem) {
            if (!newItemData.name || !itemQty || !itemCost) return;
            setIsSaving(true);
            try {
                // 1. Create the item in inventory first
                const created = await createInventoryItem({
                    name: newItemData.name,
                    unit: newItemData.unit,
                    category: newItemData.category,
                    quantity: 0 // Will be updated by the order item save in backend
                });
                
                // 2. Add to order list
                setOrderItems([...orderItems, {
                    item: created.id,
                    name: created.name,
                    quantity: parseFloat(itemQty),
                    cost: parseFloat(itemCost)
                }]);
                
                // 3. Reset and refresh inventory for subsequent additions
                const invData = await fetchInventory();
                setInventoryItems(invData);
                setNewItemData({ name: '', unit: 'unidades', category: 'Otros' });
                setIsAddingNewItem(false);
            } catch (err) {
                setToast({ message: `Error: ${err.message}`, type: 'error' });
            } finally {
                setIsSaving(false);
            }
        } else {
            if (!selectedItemId || !itemQty || !itemCost) return;
            
            const invItem = inventoryItems.find(i => i.id === parseInt(selectedItemId));
            if (!invItem) return;

            setOrderItems([...orderItems, {
                item: invItem.id,
                name: invItem.name,
                quantity: parseFloat(itemQty),
                cost: parseFloat(itemCost)
            }]);
        }

        // Reset common fields
        setSelectedItemId('');
        setItemQty('');
        setItemCost('');
    };

    const removeItemFromOrder = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const totalCalculatedCost = orderItems.reduce((acc, current) => acc + current.cost, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supplierName || orderItems.length === 0) {
            setToast({ message: "Debes añadir al menos un artículo", type: 'error' });
            return;
        }
        
        setIsSaving(true);
        try {
            await createSupplierOrder({
                supplier_name: supplierName,
                total_cost: totalCalculatedCost,
                status: 'DELIVERED',
                items: orderItems
            });
            
            // Success
            setSupplierName('');
            setOrderItems([]);
            setToast({ message: "Pedido registrado y stock actualizado", type: 'success' });
            
            // DISPATCH GLOBAL REFRESH EVENT
            window.dispatchEvent(new CustomEvent('new-order-received'));
            
            loadData();
        } catch (error) {
            setToast({ message: "Error al registrar pedido", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="admin-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <header style={{ marginBottom: '30px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Truck size={32} color="#f03e3e" /> Compras al Proveedor
                </h2>
                <p style={{ color: '#666' }}>Suministros que incrementan automáticamente el stock del inventario.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '30px', alignItems: 'start' }} className="promo-form-grid">
                {/* Formulario */}
                <div className="admin-card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <Plus size={20} color="#f03e3e" /> Registrar Nueva Compra
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: 'bold' }}>Nombre del Proveedor</label>
                            <input 
                                type="text" 
                                value={supplierName} 
                                onChange={e => setSupplierName(e.target.value)} 
                                placeholder="Ej: Distribuidora de Carne, Coca Cola..."
                                required 
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>

                        {/* Selector de Artículos */}
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                                    {isAddingNewItem ? "REGISTRAR PRODUCTO NUEVO" : "Añadir del Inventario"}
                                </h4>
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddingNewItem(!isAddingNewItem)}
                                    style={{ background: isAddingNewItem ? '#f03e3e' : '#fff', color: isAddingNewItem ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '900' }}
                                >
                                    {isAddingNewItem ? "CANCELAR" : "+ PRODUCTO NUEVO"}
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {isAddingNewItem ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Nombre del producto nuevo..." 
                                            value={newItemData.name}
                                            onChange={e => setNewItemData({...newItemData, name: e.target.value})}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                                        />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            <select 
                                                value={newItemData.unit}
                                                onChange={e => setNewItemData({...newItemData, unit: e.target.value})}
                                                style={{ flex: '1 1 120px', padding: '10px', borderRadius: '8px' }}
                                            >
                                                <option value="unidades">Unidades</option>
                                                <option value="kg">Kilogramos</option>
                                                <option value="litros">Litros</option>
                                                <option value="gramos">Gramos</option>
                                                <option value="paquetes">Paquetes</option>
                                            </select>
                                            <select 
                                                value={newItemData.category}
                                                onChange={e => setNewItemData({...newItemData, category: e.target.value})}
                                                style={{ flex: '1 1 120px', padding: '10px', borderRadius: '8px' }}
                                            >
                                                <option value="Mercadería">Mercadería</option>
                                                <option value="Materia Prima">Materia Prima</option>
                                                <option value="Bebidas">Bebidas</option>
                                                <option value="Limpieza">Limpieza</option>
                                                <option value="Otros">Otros</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <select 
                                        value={selectedItemId} 
                                        onChange={e => setSelectedItemId(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                                    >
                                        <option value="">Seleccionar del Inventario...</option>
                                        {inventoryItems.map(i => (
                                            <option key={i.id} value={i.id}>{i.name} ({i.category})</option>
                                        ))}
                                    </select>
                                )}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    <input 
                                        type="number" 
                                        placeholder="Cant." 
                                        step="0.1"
                                        value={itemQty} 
                                        onChange={e => setItemQty(e.target.value)} 
                                        style={{ flex: '1 1 80px', padding: '10px', borderRadius: '8px' }}
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Costo total ($)" 
                                        value={itemCost} 
                                        onChange={e => setItemCost(e.target.value)} 
                                        style={{ flex: '1 1 120px', padding: '10px', borderRadius: '8px' }}
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={addItemToOrder}
                                    disabled={isSaving}
                                    style={{ background: '#333', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    {isAddingNewItem ? "CREAR Y AÑADIR" : "AÑADIR AL LISTADO"}
                                </button>
                            </div>
                        </div>

                        {/* Listado de items en el ticket */}
                        {orderItems.length > 0 && (
                            <div className="accounting-table-container" style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                                <table className="accounting-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Cant.</th>
                                            <th className="txt-right">Costo</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderItems.map((oi, index) => (
                                            <tr key={index}>
                                                <td data-label="Item">{oi.name}</td>
                                                <td data-label="Cant.">{oi.quantity}</td>
                                                <td data-label="Costo" className="txt-right">${oi.cost.toLocaleString('es-AR')}</td>
                                                <td data-label="Acción" style={{ textAlign: 'center' }}>
                                                    <button type="button" onClick={() => removeItemFromOrder(index)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: '15px', background: '#fff5f5', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: '#f03e3e' }}>
                                    Total: ${totalCalculatedCost.toLocaleString('es-AR')}
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSaving || orderItems.length === 0}
                            className="main-button"
                            style={{ 
                                background: orderItems.length > 0 ? '#f03e3e' : '#ccc', 
                                color: 'white', border: 'none', padding: '15px', 
                                borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
                            }}
                        >
                            <ShoppingCart size={20} style={{ marginRight: '8px' }} />
                            {isSaving ? "PROCESANDO COMPRA..." : "REGISTRAR EN ALMACÉN"}
                        </button>
                    </form>
                </div>

                {/* Historial */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <History size={20} color="#f03e3e" /> Historial de Compras
                        </h3>
                        <div className="search-bar" style={{ position: 'relative', width: '220px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar proveedor..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '8px 10px 8px 35px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', width: '100%', background: '#fff' }}
                            />
                        </div>
                    </div>
                    <div className="accounting-table-container">
                        <table className="accounting-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Proveedor</th>
                                    <th className="txt-right">Importe</th>
                                    <th>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No hay pedidos registrados.</td></tr>
                                ) : (
                                    orders.filter(order => 
                                        (order.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (order.id.toString()).includes(searchTerm)
                                    ).map(order => (
                                        <tr key={order.id}>
                                            <td data-label="Fecha">{new Date(order.date).toLocaleDateString()}</td>
                                            <td data-label="Proveedor">{order.supplier_name}</td>
                                            <td data-label="Importe" className="txt-right negative">-${parseInt(order.total_cost).toLocaleString('es-AR')}</td>
                                            <td data-label="Detalles" style={{ fontSize: '0.75rem', color: '#888' }}>
                                                {order.items?.length || 0} productos
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierOrders;
