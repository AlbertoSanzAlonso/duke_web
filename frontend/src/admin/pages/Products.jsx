import React, { useState, useEffect, useCallback } from 'react';
import {
    fetchProducts, createProduct, deleteProduct, updateProduct,
    fetchInventory, createInventoryItem,
    fetchProductIngredients, createProductIngredient, updateProductIngredient, deleteProductIngredient
} from '../../services/api';
import { Search, FlaskConical, Plus, Trash2, Pencil, Check, X, ChevronLeft, PackagePlus } from 'lucide-react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ImageCropper from '../components/ImageCropper';

/* ─── Constantes ──────────────────────────────────────────── */
const CATEGORIES = ['Burgers', 'Pachatas', 'Pizzas', 'Bebidas'];
const UNITS = ['unidades', 'kg', 'gramos', 'litros', 'ml', 'paquetes'];
const INV_CATEGORIES = ['Mercadería', 'Materia Prima', 'Bebidas', 'Limpieza', 'Otros'];

/* ─── Sub-componente: Panel Materia Prima ─────────────────── */
function RawMaterialPanel({ product, onClose, onUpdate }) {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    // Panel "añadir ingrediente": null | 'select' | 'new-item'
    const [addMode, setAddMode] = useState(null);
    // Form: seleccionar existente
    const [selItemId, setSelItemId] = useState('');
    const [selQty, setSelQty] = useState('');
    const [selMeasurementUnit, setSelMeasurementUnit] = useState('unidades');
    // Form: crear nuevo ítem inventario
    const [newItem, setNewItem] = useState({ 
        name: '', unit: 'unidades', category: 'Materia Prima', quantity: '0', min_stock: '0',
        hasPack: false, packName: 'cajas', unitsPerPack: '10',
        hasWeight: false, weightPerUnit: '1000', weightUnit: 'g',
        useSubUnits: false, subUnitName: 'unidades', subUnitsPerUnit: '1'
    });
    const [newQty, setNewQty] = useState('');
    const [newMeasurementUnit, setNewMeasurementUnit] = useState('unidades');
    const [saving, setSaving] = useState(false);
    // Edición inline de cantidad
    const [editingIngredientId, setEditingIngredientId] = useState(null);
    const [editQty, setEditQty] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [inv, ing] = await Promise.all([
                fetchInventory(),
                fetchProductIngredients(product.id)
            ]);
            setInventoryItems(inv);
            // Filter only those belonging to this product
            setIngredients(ing.filter(i => i.product === product.id));
        } catch (e) {
            setToast({ message: e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [product.id]);

    useEffect(() => { load(); }, [load]);

    const alreadyLinkedIds = ingredients.map(i => i.inventory_item);

    /* --- Añadir desde inventario existente --- */
    const handleAddExisting = async () => {
        if (!selItemId || !selQty || parseFloat(selQty) <= 0) return;
        setSaving(true);
        try {
            await createProductIngredient({ 
                product: product.id, 
                inventory_item: parseInt(selItemId), 
                quantity_per_unit: parseFloat(selQty),
                measurement_unit: selMeasurementUnit
            });
            setToast({ message: 'Ingrediente añadido', type: 'success' });
            setSelItemId(''); setSelQty(''); setSelMeasurementUnit('unidades'); setAddMode(null);
            load();
            if (onUpdate) onUpdate(true); // Refrescar lista de productos principal de forma silenciosa
        } catch (e) {
            setToast({ message: e.message, type: 'error' });
        } finally { setSaving(false); }
    };

    /* --- Crear nuevo ítem inventario y enlazar --- */
    const handleCreateAndLink = async () => {
        if (!newItem.name || !newQty || parseFloat(newQty) <= 0) return;
        setSaving(true);
        try {
            const created = await createInventoryItem({
                name: newItem.name,
                unit: newItem.unit,
                category: newItem.category,
                quantity: parseFloat(newItem.quantity) || 0,
                min_stock: parseFloat(newItem.min_stock) || 0,
                pack_name: newItem.hasPack ? newItem.packName : null,
                units_per_pack: newItem.hasPack ? (parseFloat(newItem.unitsPerPack) || 1) : 1,
                has_weight: newItem.hasWeight,
                weight_per_unit: newItem.hasWeight ? (parseFloat(newItem.weightPerUnit) || 0) : 0,
                weight_unit: newItem.hasWeight ? newItem.weightUnit : 'g',
                use_sub_units: newItem.useSubUnits,
                sub_unit_name: newItem.subUnitName,
                sub_units_per_unit: newItem.useSubUnits ? (parseFloat(newItem.subUnitsPerUnit) || 1) : 1
            });
            await createProductIngredient({ 
                product: product.id, 
                inventory_item: created.id, 
                quantity_per_unit: parseFloat(newQty),
                measurement_unit: newMeasurementUnit
            });
            setToast({ message: `"${created.name}" creado y enlazado`, type: 'success' });
            setNewItem({ 
                name: '', unit: 'unidades', category: 'Materia Prima', quantity: '0', min_stock: '0',
                hasPack: false, packName: 'cajas', unitsPerPack: '10',
                hasWeight: false, weightPerUnit: '1000', weightUnit: 'g'
            });
            setNewQty(''); setNewMeasurementUnit('unidades'); setAddMode(null);
            load();
            if (onUpdate) onUpdate(true);
        } catch (e) {
            setToast({ message: e.message, type: 'error' });
        } finally { setSaving(false); }
    };

    /* --- Eliminar enlace --- */
    const handleDelete = async (id) => {
        try {
            await deleteProductIngredient(id);
            setToast({ message: 'Ingrediente eliminado', type: 'success' });
            load();
            if (onUpdate) onUpdate(true);
        } catch (e) { setToast({ message: e.message, type: 'error' }); }
    };

    /* --- Editar cantidad inline --- */
    const handleSaveEdit = async (id) => {
        if (!editQty || parseFloat(editQty) <= 0) return;
        try {
            await updateProductIngredient(id, { quantity_per_unit: parseFloat(editQty) });
            setEditingIngredientId(null);
            load();
        } catch (e) { setToast({ message: e.message, type: 'error' }); }
    };

    /* --- Estilos internos --- */
    const s = {
        panel: { display: 'flex', flexDirection: 'column', gap: 0 },
        header: {
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '20px 60px 16px 24px', borderBottom: '1px solid #f0f0f0',
            position: 'relative'
        },
        backBtn: {
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: '#666', fontSize: '0.85rem', fontWeight: 'bold', padding: '6px 10px',
            borderRadius: '8px', transition: 'background 0.2s'
        },
        title: { margin: 0, fontSize: '1.1rem', fontWeight: '800' },
        body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
        ingredient: {
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', background: '#f8f9fa',
            borderRadius: '10px', marginBottom: '8px', border: '1px solid #eee'
        },
        nameCol: { flex: 1, fontWeight: '600', fontSize: '0.9rem', color: '#222' },
        unitBadge: {
            background: '#e9ecef', color: '#555', padding: '2px 8px',
            borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700'
        },
        qtyBox: {
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '4px 10px'
        },
        qtyInput: {
            width: '70px', border: 'none', outline: 'none',
            fontWeight: '700', fontSize: '0.9rem', textAlign: 'right', background: 'transparent'
        },
        addBar: {
            margin: '16px 24px 0', padding: '16px',
            background: '#fff', border: '1px solid #ddd', borderRadius: '14px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        },
        label: { fontSize: '0.72rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
        input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', fontFamily: 'inherit' },
        select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', background: '#fff', fontFamily: 'inherit' },
        row: { display: 'flex', gap: '10px', marginTop: '10px' },
        btnPrimary: {
            flex: 1, padding: '11px', background: '#333', color: '#fff',
            border: 'none', borderRadius: '10px', fontWeight: '800',
            cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
        },
        btnSecondary: {
            padding: '11px 16px', background: '#f1f3f5', color: '#555',
            border: 'none', borderRadius: '10px', fontWeight: '700',
            cursor: 'pointer', fontSize: '0.9rem'
        },
        footer: { padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }
    };

    const availableItems = inventoryItems.filter(i => !alreadyLinkedIds.includes(i.id));

    return (
        <div style={s.panel}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={s.header}>
                <button style={s.backBtn} onClick={onClose}>
                    <ChevronLeft size={16} /> Volver al producto
                </button>
                <div style={{ flex: 1 }} />
                <FlaskConical size={20} color="#f03e3e" />
                <h3 style={{ ...s.title, maxWidth: 'calc(100% - 120px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Materia Prima: {product.name}
                </h3>
            </div>

            {/* Lista de ingredientes */}
            <div style={s.body}>
                {loading ? (
                    <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Cargando...</p>
                ) : ingredients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#bbb' }}>
                        <FlaskConical size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                        <p style={{ margin: 0, fontWeight: '600' }}>Sin ingredientes configurados</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Añade los materiales necesarios para elaborar este producto.</p>
                    </div>
                ) : (
                    ingredients.map(ing => (
                        <div key={ing.id} style={s.ingredient}>
                            <span style={s.nameCol}>{ing.inventory_item_name}</span>
                            <span style={s.unitBadge}>Base: {ing.inventory_item_unit}</span>

                            {editingIngredientId === ing.id ? (
                                <>
                                    <div style={s.qtyBox}>
                                        <input
                                            autoFocus
                                            type="number"
                                            step="0.001"
                                            value={editQty}
                                            onChange={e => setEditQty(e.target.value)}
                                            style={s.qtyInput}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: '#888' }}>/ pedido</span>
                                    </div>
                                    <button onClick={() => handleSaveEdit(ing.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2b8a3e' }}><Check size={18} /></button>
                                    <button onClick={() => setEditingIngredientId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={18} /></button>
                                </>
                            ) : (
                                <>
                                    <div style={s.qtyBox}>
                                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{parseFloat(ing.quantity_per_unit)} {(ing.measurement_unit || 'unidades')}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#888' }}>/ pedido</span>
                                    </div>
                                    <button onClick={() => { setEditingIngredientId(ing.id); setEditQty(String(ing.quantity_per_unit)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '4px' }} title="Editar cantidad">
                                        <Pencil size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(ing.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e03131', padding: '4px' }} title="Eliminar">
                                        <Trash2 size={15} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))
                )}

                {/* Panel añadir */}
                {addMode === null && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button
                            onClick={() => setAddMode('select')}
                            style={{ ...s.btnPrimary, background: '#333' }}
                        >
                            <Plus size={16} /> Añadir del inventario
                        </button>
                        <button
                            onClick={() => setAddMode('new-item')}
                            style={{ ...s.btnPrimary, background: '#ae3ec9' }}
                        >
                            <PackagePlus size={16} /> Crear nuevo ítem
                        </button>
                    </div>
                )}

                {/* Formulario: seleccionar del inventario existente */}
                {addMode === 'select' && (
                    <div style={s.addBar}>
                        <label style={s.label}>Ítem de inventario</label>
                        <select value={selItemId} onChange={e => setSelItemId(e.target.value)} style={s.select}>
                            <option value="">Seleccionar...</option>
                            {availableItems.map(i => (
                                <option key={i.id} value={i.id}>{i.name} ({i.category}) — stock: {i.quantity} {i.unit}</option>
                            ))}
                        </select>
                        <div style={s.row}>
                            {selItemId && (() => {
                                const matchedItem = availableItems.find(i => String(i.id) === String(selItemId));
                                return (
                                    <div style={{ flex: 1 }}>
                                        <label style={s.label}>Cantidad a descontar por pedido</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="number" step="any" placeholder="ej. 200"
                                                value={selQty} onChange={e => setSelQty(e.target.value)}
                                                style={s.input}
                                            />
                                            <select 
                                                value={selMeasurementUnit} 
                                                onChange={e => setSelMeasurementUnit(e.target.value)} 
                                                style={{...s.select, width: '120px'}}
                                            >
                                                {matchedItem?.has_weight && (
                                                    <>
                                                        <option value="g">Gramos (g)</option>
                                                        <option value="kg">Kilos (kg)</option>
                                                        <option value="ml">Mililitros (ml)</option>
                                                        <option value="l">Litros (l)</option>
                                                    </>
                                                )}
                                                <option value="unidades">Uds. Base ({matchedItem?.unit || 'uds'})</option>
                                                {matchedItem?.pack_name && (
                                                    <option value="pack">Por {matchedItem.pack_name}</option>
                                                )}
                                                {matchedItem?.use_sub_units && (
                                                    <option value="sub-unit">Por {matchedItem.sub_unit_name || 'unidades'}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div style={{ flex: 0, display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                                <button onClick={handleAddExisting} disabled={saving} style={{ ...s.btnPrimary, flex: 0, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                                    {saving ? '...' : <><Check size={16} /> Añadir</>}
                                </button>
                                <button onClick={() => { setAddMode(null); setSelItemId(''); setSelQty(''); }} style={{ ...s.btnSecondary, padding: '10px' }}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulario: crear nuevo ítem de inventario */}
                {addMode === 'new-item' && (
                    <div style={s.addBar}>
                        <p style={{ margin: '0 0 12px', fontWeight: '800', fontSize: '0.85rem', color: '#ae3ec9' }}>✦ NUEVO ÍTEM DE INVENTARIO</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={s.label}>Nombre del producto</label>
                                <input
                                    type="text" placeholder="ej. Queso Cheddar"
                                    value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    style={s.input}
                                />
                            </div>
                            <div>
                                <label style={s.label}>Unidad</label>
                                <select value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} style={s.select}>
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Categoría inventario</label>
                                <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} style={s.select}>
                                    {INV_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Stock inicial</label>
                                <input
                                    type="number" step="0.1"
                                    value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                                    style={s.input}
                                />
                            </div>
                            <div>
                                <label style={s.label}>Stock mínimo (alerta)</label>
                                <input
                                    type="number" step="0.1"
                                    value={newItem.min_stock} onChange={e => setNewItem({ ...newItem, min_stock: e.target.value })}
                                    style={s.input}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1', background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}>
                                    <input type="checkbox" checked={newItem.hasPack} onChange={e => setNewItem({ ...newItem, hasPack: e.target.checked })} />
                                    ¿Llega en envases/packs?
                                </label>
                                {newItem.hasPack && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                        <input type="text" placeholder="Ej: Cajas" value={newItem.packName} onChange={e => setNewItem({ ...newItem, packName: e.target.value })} style={s.input} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>trae:</span>
                                            <input type="number" value={newItem.unitsPerPack} onChange={e => setNewItem({ ...newItem, unitsPerPack: e.target.value })} style={{...s.input, width: '60px'}} />
                                            <span style={{ fontSize: '0.8rem' }}>uds base</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ gridColumn: '1 / -1', background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}>
                                    <input type="checkbox" checked={newItem.hasWeight} onChange={e => setNewItem({ ...newItem, hasWeight: e.target.checked })} />
                                    ¿Cada unidad tiene peso fijo?
                                </label>
                                {newItem.hasWeight && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem' }}>Pesa:</span>
                                        <input type="number" value={newItem.weightPerUnit} onChange={e => setNewItem({ ...newItem, weightPerUnit: e.target.value })} style={{...s.input, width: '80px'}} />
                                        <select value={newItem.weightUnit} onChange={e => setNewItem({ ...newItem, weightUnit: e.target.value })} style={s.select}>
                                            <option value="g">Gramos (g)</option>
                                            <option value="kg">Kilos (kg)</option>
                                            <option value="ml">Mililitros (ml)</option>
                                            <option value="l">Litros (l)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ gridColumn: '1 / -1', background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}>
                                    <input type="checkbox" checked={newItem.useSubUnits} onChange={e => setNewItem({ ...newItem, useSubUnits: e.target.checked })} />
                                    ¿Dividir en sub-unidades (ej. fetas)?
                                </label>
                                {newItem.useSubUnits && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', alignItems: 'center' }}>
                                        <input type="text" placeholder="Ej: fetas" value={newItem.subUnitName} onChange={e => setNewItem({ ...newItem, subUnitName: e.target.value })} style={s.input} />
                                        <span style={{ fontSize: '0.8rem' }}>trae:</span>
                                        <input type="number" step="any" value={newItem.subUnitsPerUnit} onChange={e => setNewItem({ ...newItem, subUnitsPerUnit: e.target.value })} style={{...s.input, width: '60px'}} />
                                    </div>
                                )}
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={s.label}>Cantidad a descontar por pedido</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number" step="any" placeholder="ej. 0.05"
                                        value={newQty} onChange={e => setNewQty(e.target.value)}
                                        style={s.input}
                                    />
                                    <select 
                                        value={newMeasurementUnit} 
                                        onChange={e => setNewMeasurementUnit(e.target.value)} 
                                        style={{...s.select, width: '120px'}}
                                    >
                                        {newItem.hasWeight && (
                                            <>
                                                <option value="g">Gramos (g)</option>
                                                <option value="kg">Kilos (kg)</option>
                                                <option value="ml">Mililitros (ml)</option>
                                                <option value="l">Litros (l)</option>
                                            </>
                                        )}
                                        <option value="unidades">Uds. Base ({newItem.unit || 'uds'})</option>
                                        {newItem.hasPack && (
                                            <option value="pack">Por {newItem.packName}</option>
                                        )}
                                        {newItem.useSubUnits && (
                                            <option value="sub-unit">Por {newItem.subUnitName || 'unidades'}</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ ...s.row, marginTop: '14px' }}>
                            <button onClick={handleCreateAndLink} disabled={saving} style={{ ...s.btnPrimary, background: '#ae3ec9' }}>
                                {saving ? 'Creando...' : <><PackagePlus size={16} /> Crear y enlazar al producto</>}
                            </button>
                            <button onClick={() => { setAddMode(null); setNewItem({ name: '', unit: 'unidades', category: 'Materia Prima', quantity: '0', min_stock: '0' }); setNewQty(''); }} style={s.btnSecondary}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={s.footer}>
                <button onClick={onClose} style={{ padding: '10px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                    Cerrar materia prima
                </button>
            </div>
        </div>
    );
}

/* ─── Componente principal ────────────────────────────────── */
function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [category, setCategory] = useState('Burgers');
    const [image, setImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '', ingredients: '', category: 'Burgers', image: null, removeImage: false });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Panel materia prima
    const [rawMaterialProduct, setRawMaterialProduct] = useState(null); // product obj | null

    // Crop state
    const [imageToCrop, setImageToCrop] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [originalFileName, setOriginalFileName] = useState('');

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await fetchProducts();
            setProducts(data);
        } catch (err) {
            if (!silent) setError(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name) return;
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('ingredients', ingredients);
            formData.append('category', category);
            if (image) formData.append('image', image);
            await createProduct(formData);
            setName(''); setDescription(''); setIngredients(''); setCategory('Burgers'); setImage(null);
            loadProducts();
            setToast({ message: 'Producto creado con éxito', type: 'success' });
            setIsModalOpen(false);
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleDeleteTrigger = (id) => {
        setProductToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteProduct(productToDelete);
            setIsConfirmOpen(false);
            setProductToDelete(null);
            loadProducts();
            setToast({ message: 'Producto eliminado del catálogo', type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleEditStart = (prod) => {
        setEditingId(prod.id);
        setEditData({
            name: prod.name,
            description: prod.description || '',
            ingredients: prod.ingredients || '',
            category: prod.category || 'Burgers',
            image: null,
            removeImage: false,
            currentImageUrl: prod.image
        });
        setRawMaterialProduct(null);
        setIsModalOpen(true);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editData.name);
            formData.append('description', editData.description);
            formData.append('ingredients', editData.ingredients);
            formData.append('category', editData.category);
            if (editData.removeImage) {
                formData.append('image', '');
            } else if (editData.image) {
                formData.append('image', editData.image);
            }
            await updateProduct(editingId, formData);
            setEditingId(null);
            setIsModalOpen(false);
            loadProducts();
            setToast({ message: 'Producto actualizado', type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setOriginalFileName(file.name);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageToCrop(reader.result);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob) => {
        const file = new File([croppedBlob], originalFileName.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });
        if (editingId) {
            setEditData({ ...editData, image: file, removeImage: false });
        } else {
            setImage(file);
        }
        setIsCropping(false);
        setImageToCrop(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setRawMaterialProduct(null);
    };

    /* ── Filtered products ── */
    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.ingredients && p.ingredients.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    /* ── RENDER ── */
    return (
        <div className="admin-card">
            {isCropping && (
                <ImageCropper
                    image={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => { setIsCropping(false); setImageToCrop(null); }}
                />
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Gestión de Productos (Catálogo Base)</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Gestiona recetas, fotos y materia prima de cada producto.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="main-button"
                    style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(240, 62, 62, 0.2)' }}
                >
                    + NUEVO PRODUCTO
                </button>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="category-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                    {['Todas', ...CATEGORIES].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                                borderColor: filterCategory === cat ? 'var(--admin-primary)' : '#ddd',
                                background: filterCategory === cat ? 'var(--admin-primary)' : 'white',
                                color: filterCategory === cat ? 'white' : '#666',
                                fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="search-bar" style={{ position: 'relative', width: '320px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input
                        type="text"
                        placeholder="Buscar en catálogo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '12px 15px 12px 40px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '0.95rem', width: '100%' }}
                    />
                </div>
            </div>

            {/* ── MODAL ── */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '820px', maxHeight: '92dvh', overflowY: 'auto', borderRadius: '24px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <button onClick={closeModal} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f3f5', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>✕</button>

                        {rawMaterialProduct ? (
                            /* ── Panel Materia Prima ── */
                            <RawMaterialPanel
                                product={rawMaterialProduct}
                                onClose={() => setRawMaterialProduct(null)}
                                onUpdate={loadProducts}
                            />
                        ) : (
                            /* ── Formulario producto ── */
                            <div style={{ padding: '35px' }}>
                                <h2 style={{ marginBottom: '6px' }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                <p style={{ color: '#868e96', marginBottom: '24px' }}>
                                    {editingId ? 'Modifica los datos técnicos de la receta.' : 'Carga un nuevo producto al catálogo base de Duke.'}
                                </p>

                                <form onSubmit={editingId ? handleEditSave : handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                        {/* Nombre */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Nombre del Producto *</label>
                                            <input
                                                type="text"
                                                value={editingId ? editData.name : name}
                                                onChange={e => editingId ? setEditData({ ...editData, name: e.target.value }) : setName(e.target.value)}
                                                required
                                                style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                            />
                                        </div>
                                        {/* Categoría */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Categoría</label>
                                            <select
                                                value={editingId ? editData.category : category}
                                                onChange={e => editingId ? setEditData({ ...editData, category: e.target.value }) : setCategory(e.target.value)}
                                                style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', background: 'white' }}
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
                                            </select>
                                        </div>
                                        {/* Imagen */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Imagen del Producto (Aprox. 1:1)</label>
                                            <input
                                                type="file" accept="image/*"
                                                onChange={onFileChange}
                                                style={{ padding: '10px', fontSize: '0.85rem', width: '100%', borderRadius: '12px', border: '1px solid #ddd', background: '#f8f9fa' }}
                                            />
                                            {(image || (editingId && editData.image)) && <p style={{ fontSize: '0.8rem', color: 'green', margin: 0 }}>✓ Imagen lista para guardar</p>}
                                            {editingId && editData.currentImageUrl && !editData.image && !editData.removeImage && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setOriginalFileName(`${editData.name}.webp`); setImageToCrop(editData.currentImageUrl); setIsCropping(true); }}
                                                    style={{ marginTop: '8px', padding: '10px', background: '#f1f3f5', border: '1px solid #dee2e6', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    ✂️ Recortar imagen actual
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Descripción Corta</label>
                                        <textarea
                                            value={editingId ? editData.description : description}
                                            onChange={e => editingId ? setEditData({ ...editData, description: e.target.value }) : setDescription(e.target.value)}
                                            style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', minHeight: '80px', resize: 'vertical' }}
                                        />
                                    </div>

                                    {/* Ingredientes (texto para el cliente) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Ingredientes (visibles al cliente)</label>
                                        <textarea
                                            value={editingId ? editData.ingredients : ingredients}
                                            onChange={e => editingId ? setEditData({ ...editData, ingredients: e.target.value }) : setIngredients(e.target.value)}
                                            placeholder="Lechuga, Tomate, Cheddar..."
                                            style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', minHeight: '60px', resize: 'vertical' }}
                                        />
                                    </div>

                                    {editingId && editData.name && products.find(p => p.id === editingId)?.image && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e03131', cursor: 'pointer', fontWeight: 'bold' }}>
                                            <input type="checkbox" checked={editData.removeImage} onChange={e => setEditData({ ...editData, removeImage: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                            Eliminar fotografía actual
                                        </label>
                                    )}

                                    {/* Botón Materia Prima (solo en edición) */}
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => setRawMaterialProduct(products.find(p => p.id === editingId))}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                padding: '14px', background: '#f3f0ff', border: '2px solid #ae3ec9',
                                                borderRadius: '12px', color: '#ae3ec9', fontWeight: '800',
                                                cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s'
                                            }}
                                        >
                                            <FlaskConical size={20} />
                                            Gestionar Materia Prima
                                            {(() => {
                                                const prod = products.find(p => p.id === editingId);
                                                const count = prod?.ingredients_list?.length || 0;
                                                return count > 0 ? (
                                                    <span style={{ background: '#ae3ec9', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: '900' }}>
                                                        {count} ítem{count !== 1 ? 's' : ''}
                                                    </span>
                                                ) : null;
                                            })()}
                                        </button>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                        <button type="button" onClick={closeModal} style={{ flex: 1, padding: '15px', background: '#eee', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>CANCELAR</button>
                                        <button type="submit" className="main-button" style={{ flex: 2, padding: '15px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(240, 62, 62, 0.3)' }}>
                                            {editingId ? '💾 GUARDAR CAMBIOS' : '🚀 CREAR PRODUCTO'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Lista de Productos ── */}
            <div style={{ marginTop: '30px' }}>
                {loading ? <p>Cargando catálogo...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : filteredProducts.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}>
                        No hay productos en el catálogo base. ¡Añade tu primera receta!
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredProducts.map(prod => (
                            <div key={prod.id} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ width: '100%', height: '220px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        {prod.category?.toUpperCase()}
                                    </div>
                                    {/* Badge materia prima */}
                                    {prod.ingredients_list?.length > 0 && (
                                        <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#ae3ec9', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FlaskConical size={12} /> {prod.ingredients_list.length} MP
                                        </div>
                                    )}
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999' }}>
                                            <span style={{ fontSize: '3rem' }}>🍔</span>
                                            <span style={{ fontSize: '0.8rem' }}>Sin Fotografía</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: '#222' }}>{prod.name}</h3>
                                    <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.4', flex: '1' }}>{prod.description || 'Sin descripción.'}</p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleEditStart(prod)}
                                            style={{ flex: 1, padding: '12px 0', background: '#f8f9fa', border: '1px solid #ddd', color: '#333', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '1rem' }}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTrigger(prod.id)}
                                            style={{ padding: '12px 20px', background: '#fff5f5', border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '1rem' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isConfirmOpen && (
                <ConfirmModal
                    isOpen={isConfirmOpen}
                    title="ELIMINAR PRODUCTO"
                    message="¿Estás seguro de que quieres eliminar este producto de la base de datos? Esta acción no se puede deshacer."
                    onConfirm={handleDelete}
                    onCancel={() => setIsConfirmOpen(false)}
                />
            )}
        </div>
    );
}

export default Products;
