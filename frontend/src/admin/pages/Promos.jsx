import { useState, useEffect, useRef } from 'react';
import { fetchMenuEntries, createMenuEntry, deleteMenuEntry, createProduct } from '../../services/api';
import Toast from '../components/Toast';
import { Star, Upload, Trash2 } from 'lucide-react';

function Promos() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // New Fields for Direct Promo Creation
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    
    const category = 'Promos';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const menuData = await fetchMenuEntries();
            const promoEntries = menuData.filter(e => e.category === 'Promos');
            setEntries(promoEntries);
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
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name || !price) return;
        
        try {
            setLoading(true);
            
            // 1. Create the Product in background
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            if (image) {
                formData.append('image', image);
            }
            
            const newProduct = await createProduct(formData);
            
            // 2. Link it to the Menu as a Promo
            await createMenuEntry({
                product_id: newProduct.id,
                price: parseFloat(price),
                category,
                is_available: true
            });

            // Reset Form
            setName('');
            setDescription('');
            setPrice('');
            setImage(null);
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            setToast({ message: "¡Promoción lanzada con éxito!", type: 'success' });
            loadData();
        } catch (err) {
            setToast({ message: "Error al crear la promoción: " + err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres retirar esta promoción? Dejará de verse en la web.")) return;
        try {
            await deleteMenuEntry(id);
            setToast({ message: "Promoción retirada de la vista pública.", type: 'success' });
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
                <h2 style={{ margin: 0 }}>Gestión de Promociones</h2>
            </div>
            <p style={{ color: '#666', marginBottom: '30px' }}>Aquí puedes crear combos (ej: Burger + Papas) con su propio nombre, descripción y foto exclusiva.</p>

            <form onSubmit={handleCreate} style={{ 
                background: '#fff', 
                padding: '25px', 
                borderRadius: '16px',
                border: '1px solid #eee',
                marginBottom: '40px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>DESCRIPCIÓN (¿Qué incluye?)</label>
                            <textarea 
                                placeholder="Ej: 2 Burgers Simples + 2 Papas Medianas + Bebida 1.5L" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', minHeight: '80px', resize: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>PRECIO FINAL ($) *</label>
                            <input 
                                type="number" 
                                placeholder="0" 
                                value={price} 
                                onChange={e => setPrice(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.2rem', fontWeight: 'bold' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>FOTO DE LA PROMO</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            style={{ 
                                flex: 1,
                                border: '2px dashed #ddd',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: '#fcfcfc',
                                transition: 'all 0.2s',
                                minHeight: '200px'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--admin-primary)'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <Upload size={40} color="#999" />
                                    <p style={{ color: '#999', marginTop: '10px', fontSize: '0.9rem' }}>Click para subir imagen</p>
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
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="main-button" 
                    style={{ 
                        width: '100%',
                        marginTop: '25px',
                        padding: '15px', 
                        background: 'var(--admin-primary)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'PUBLICANDO...' : '🚀 LANZAR PROMOCIÓN'}
                </button>
            </form>

            <h3 style={{ marginBottom: '20px' }}>Promociones Actuales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {entries.length === 0 ? (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999', background: '#f9f9f9', borderRadius: '12px' }}>
                        No hay promociones activas. ¡Crea la primera arriba!
                    </p>
                ) : (
                    entries.map(entry => (
                        <div key={entry.id} style={{ 
                            background: 'white', 
                            borderRadius: '12px', 
                            border: '1px solid #eee',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            position: 'relative'
                        }}>
                             <div style={{ height: '180px', background: '#eee', position: 'relative' }}>
                                {entry.product?.image ? (
                                    <img src={entry.product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎁</div>}
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
                             </div>
                             <div style={{ padding: '20px' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>{entry.product?.name}</h3>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.4', minHeight: '2.8em' }}>
                                    {entry.product?.description || 'Sin descripción.'}
                                </p>
                                <button 
                                    onClick={() => handleDelete(entry.id)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        background: '#fff', 
                                        border: '1px solid #ff4d4d', 
                                        color: '#ff4d4d', 
                                        borderRadius: '8px', 
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} /> Retirar Promo
                                </button>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Promos;
