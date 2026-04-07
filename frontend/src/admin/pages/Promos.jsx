import { useState, useEffect, useRef } from 'react';
import { fetchMenuEntries, createMenuEntry, deleteMenuEntry, createProduct, updateProduct, updateMenuEntry, fetchProducts } from '../../services/api';
import Toast from '../components/Toast';
import { Star, Upload, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';

function Promos() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [removeImage, setRemoveImage] = useState(false);
    
    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingProductId, setEditingProductId] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [useExistingProduct, setUseExistingProduct] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    
    // Scheduling state
    const [schedule, setSchedule] = useState({
        active_monday: true,
        active_tuesday: true,
        active_wednesday: true,
        active_thursday: true,
        active_friday: true,
        active_saturday: true,
        active_sunday: true,
        start_date: '',
        end_date: ''
    });

    const fileInputRef = useRef(null);
    const category = 'Promos';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [menuData, productsData] = await Promise.all([
                fetchMenuEntries(),
                fetchProducts()
            ]);
            const promoEntries = menuData.filter(e => e.category === 'Promos');
            setEntries(promoEntries);
            setAllProducts(productsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setRemoveImage(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setImage(null);
        setImagePreview(null);
        setIsAvailable(true);
        setRemoveImage(false);
        setIsEditing(false);
        setEditingId(null);
        setEditingProductId(null);
        setUseExistingProduct(false);
        setSelectedProductId('');
        setSchedule({
            active_monday: true,
            active_tuesday: true,
            active_wednesday: true,
            active_thursday: true,
            active_friday: true,
            active_saturday: true,
            active_sunday: true,
            start_date: '',
            end_date: ''
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEditClick = (entry) => {
        setName(entry.product.name);
        setDescription(entry.product.description || '');
        setPrice(entry.price);
        setImagePreview(entry.product.image);
        setIsAvailable(entry.is_available);
        setRemoveImage(false);
        setIsEditing(true);
        setEditingId(entry.id);
        setEditingProductId(entry.product.id);
        setUseExistingProduct(false); 
        
        setSchedule({
            active_monday: entry.active_monday ?? true,
            active_tuesday: entry.active_tuesday ?? true,
            active_wednesday: entry.active_wednesday ?? true,
            active_thursday: entry.active_thursday ?? true,
            active_friday: entry.active_friday ?? true,
            active_saturday: entry.active_saturday ?? true,
            active_sunday: entry.active_sunday ?? true,
            start_date: entry.start_date || '',
            end_date: entry.end_date || ''
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price) return;
        
        try {
            setLoading(true);
            
            if (isEditing) {
                // UPDATE
                const formData = new FormData();
                formData.append('name', name);
                formData.append('description', description);
                
                if (removeImage) {
                    formData.append('image', '');
                } else if (image) {
                    formData.append('image', image);
                }
                
                await updateProduct(editingProductId, formData);
                await updateMenuEntry(editingId, {
                    price: parseFloat(price),
                    is_available: isAvailable,
                    ...schedule,
                    start_date: schedule.start_date || null,
                    end_date: schedule.end_date || null
                });
                
                setToast({ message: "¡Promoción actualizada!", type: 'success' });
            } else {
                // CREATE
                let productId = selectedProductId;

                if (!useExistingProduct) {
                    const formData = new FormData();
                    formData.append('name', name);
                    formData.append('description', description);
                    if (image) {
                        formData.append('image', image);
                    }
                    const newProduct = await createProduct(formData);
                    productId = newProduct.id;
                }
                
                await createMenuEntry({
                    product_id: productId,
                    price: parseFloat(price),
                    category,
                    is_available: true,
                    ...schedule,
                    start_date: schedule.start_date || null,
                    end_date: schedule.end_date || null
                });
                
                setToast({ message: "¡Promoción lanzada con éxito!", type: 'success' });
            }

            resetForm();
            loadData();
        } catch (err) {
            setToast({ message: "Error: " + err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async (entry) => {
        try {
            await updateMenuEntry(entry.id, { is_available: !entry.is_available });
            setToast({ 
                message: entry.is_available ? "Promo desactivada (fuera de carta)" : "Promo activada de nuevo", 
                type: 'success' 
            });
            loadData();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres ELIMINAR esta promoción PERMANENTEMENTE?")) return;
        try {
            await deleteMenuEntry(id);
            setToast({ message: "Promoción eliminada correctamente.", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    return (
        <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <Star size={32} color="var(--admin-primary)" fill="var(--admin-primary)" />
                <h2 style={{ margin: 0 }}>{isEditing ? 'Editando Promoción' : 'Gestión de Promociones'}</h2>
            </div>
            <p style={{ color: '#666', marginBottom: '30px' }}>
                {isEditing ? 'Modifica los datos del combo y guarda los cambios.' : 'Aquí puedes crear combos (ej: Burger + Papas) con su propio nombre, descripción y foto exclusiva.'}
            </p>

            <form onSubmit={handleSubmit} style={{ 
                background: isEditing ? '#fff9db' : '#fff', 
                padding: '25px', 
                borderRadius: '16px',
                border: isEditing ? '2px solid #fcc419' : '1px solid #eee',
                marginBottom: '40px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
            }}>
                <div className="promo-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {!isEditing && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer', background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={useExistingProduct} 
                                        onChange={e => setUseExistingProduct(e.target.checked)} 
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: 'bold', color: '#555' }}>ELEGIR PRODUCTO EXISTENTE</span>
                                </label>
                            </div>
                        )}

                        {useExistingProduct && !isEditing ? (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>SELECCIONAR PRODUCTO *</label>
                                <select 
                                    value={selectedProductId}
                                    onChange={e => {
                                        const pId = e.target.value;
                                        setSelectedProductId(pId);
                                        const prod = allProducts.find(p => p.id === parseInt(pId));
                                        if (prod) {
                                            setName(prod.name);
                                            setDescription(prod.description || '');
                                            setImagePreview(prod.image || null);
                                        } else {
                                            setImagePreview(null);
                                        }
                                    }}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: '#fff' }}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {allProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>NOMBRE DE LA PROMO *</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Combo Familiar Duke" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>DESCRIPCIÓN (¿Qué incluye?)</label>
                            <textarea 
                                placeholder="Ej: 2 Burgers Simples + 2 Papas Medianas + Bebida 1.5L" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', minHeight: '80px', resize: 'none' }}
                                disabled={useExistingProduct && !isEditing}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>PRECIO FINAL ($) *</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    step="100"
                                    min="0"
                                    className="no-arrows-input"
                                    value={price} 
                                    onChange={e => setPrice(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.4rem', fontWeight: 'bold', color: '#000' }}
                                />
                            </div>
                            {isEditing && (
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>ESTADO</label>
                                    <button 
                                        type="button"
                                        onClick={() => setIsAvailable(!isAvailable)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px', 
                                            borderRadius: '8px', 
                                            border: 'none', 
                                            background: isAvailable ? '#2f9e44' : '#e03131',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {isAvailable ? <Eye size={18} /> : <EyeOff size={18} />}
                                        {isAvailable ? 'ACTIVA' : 'PAUSADA'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>FOTO DE LA PROMO</label>
                        <div 
                            onClick={() => {
                                if (useExistingProduct && !isEditing) return;
                                fileInputRef.current?.click();
                            }}
                            style={{ 
                                flex: 2,
                                border: '2px dashed #ddd',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: (useExistingProduct && !isEditing) ? 'default' : 'pointer',
                                overflow: 'hidden',
                                background: (useExistingProduct && !isEditing) ? '#f0f0f0' : '#fcfcfc',
                                transition: 'all 0.2s',
                                minHeight: '180px',
                                opacity: (useExistingProduct && !isEditing) ? 0.7 : 1
                            }}
                        >
                            {imagePreview && !removeImage ? (
                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <Upload size={40} color="#999" />
                                    <p style={{ color: '#999', marginTop: '10px', fontSize: '0.9rem' }}>
                                        {useExistingProduct && !isEditing ? 'Usando imagen del producto' : (isEditing ? 'Click para cambiar imagen' : 'Click para subir imagen')}
                                    </p>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                        {isEditing && imagePreview && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e03131', cursor: 'pointer', fontWeight: 'bold', background: '#fff5f5', padding: '8px', borderRadius: '4px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={removeImage} 
                                    onChange={e => {
                                        setRemoveImage(e.target.checked);
                                        if (e.target.checked) setImage(null);
                                    }} 
                                />
                                Eliminar fotografía actual
                            </label>
                        )}
                        {!isEditing && useExistingProduct && (
                            <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                                Nota: Al elegir un producto existente, se usará su nombre descriptivo e imagen.
                            </p>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                    {isEditing && (
                        <button 
                            type="button" 
                            onClick={resetForm}
                            style={{ 
                                flex: 1,
                                padding: '15px', 
                                background: '#eee', 
                                color: '#444', 
                                border: 'none', 
                                borderRadius: '8px', 
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            CANCELAR
                        </button>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="main-button" 
                        style={{ 
                            flex: 2,
                            padding: '15px', 
                            background: isEditing ? '#fcc419' : 'var(--admin-primary)', 
                            color: isEditing ? '#000' : 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'PROCESANDO...' : (isEditing ? '💾 GUARDAR CAMBIOS' : '🚀 LANZAR PROMOCIÓN')}
                    </button>
                </div>
            </form>

            <h3 style={{ marginBottom: '20px' }}>Promociones Actuales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {entries.length === 0 ? (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#f9f9f9', borderRadius: '12px' }}>
                        No hay promociones. ¡Crea la primera arriba!
                    </p>
                ) : (
                    entries.map(entry => (
                        <div key={entry.id} style={{ 
                            background: 'white', 
                            borderRadius: '16px', 
                            border: '1px solid #eee',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            position: 'relative',
                            opacity: entry.is_available ? 1 : 0.6
                        }}>
                             <div style={{ height: '200px', background: '#eee', position: 'relative' }}>
                                {entry.product?.image ? (
                                    <img src={entry.product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎁</div>}
                                
                                {!entry.is_available && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: 0, left: 0, right: 0, bottom: 0, 
                                        background: 'rgba(0,0,0,0.6)', 
                                        color: 'white', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold'
                                    }}>
                                        OCULTA (PAUSADA)
                                    </div>
                                )}

                                <div style={{ 
                                    position: 'absolute', 
                                    bottom: '10px', 
                                    right: '10px', 
                                    background: 'var(--admin-primary)', 
                                    color: 'white', 
                                    padding: '5px 15px', 
                                    borderRadius: '8px', 
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                }}>
                                    ${parseInt(entry.price).toLocaleString('es-AR')}
                                </div>

                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleToggleAvailability(entry)}
                                        style={{ 
                                            background: 'white', 
                                            border: 'none', 
                                            borderRadius: '50%', 
                                            width: '36px', 
                                            height: '36px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                        }}
                                        title={entry.is_available ? "Ocultar de la web" : "Mostrar en la web"}
                                    >
                                        {entry.is_available ? <Eye size={18} color="#2f9e44" /> : <EyeOff size={18} color="#e03131" />}
                                    </button>
                                </div>
                             </div>
                             
                             <div style={{ padding: '20px' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>{entry.product?.name}</h3>
                                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4', minHeight: '2.8em' }}>
                                    {entry.product?.description || 'Sin descripción detallada.'}
                                </p>
                                
                                <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                        <span key={day} style={{ 
                                            fontSize: '0.65rem', 
                                            padding: '3px 6px', 
                                            borderRadius: '4px', 
                                            background: entry[`active_${day}`] ? '#e31837' : '#f1f1f1',
                                            color: entry[`active_${day}`] ? 'white' : '#bbb',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            {day.slice(0, 2)}
                                        </span>
                                    ))}
                                </div>

                                {(entry.start_date || entry.end_date) && (
                                    <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#888', 
                                        marginBottom: '15px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '5px',
                                        background: '#f8f9fa',
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #eee'
                                    }}>
                                        📅 {entry.start_date ? new Date(entry.start_date).toLocaleDateString() : '∞'} - {entry.end_date ? new Date(entry.end_date).toLocaleDateString() : '∞'}
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => handleEditClick(entry)}
                                        style={{ 
                                            flex: 1,
                                            padding: '10px', 
                                            background: '#f8f9fa', 
                                            border: '1px solid #ddd', 
                                            color: '#333', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Edit2 size={16} /> Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(entry.id)}
                                        style={{ 
                                            padding: '10px', 
                                            background: '#fff5f5', 
                                            border: '1px solid #ff4d4d', 
                                            color: '#ff4d4d', 
                                            borderRadius: '8px', 
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        title="Eliminar permanentemente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Promos;
