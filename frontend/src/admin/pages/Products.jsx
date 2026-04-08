import React, { useState, useEffect } from 'react';
import { fetchProducts, createProduct, deleteProduct, updateProduct } from '../../services/api';
import { Search } from 'lucide-react';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [category, setCategory] = useState('General');
    const [image, setImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '', ingredients: '', category: 'General', image: null, removeImage: false });
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Confirmation context
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await fetchProducts();
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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
            if (image) {
                formData.append('image', image);
            }

            await createProduct(formData);
            setName('');
            setDescription('');
            setIngredients('');
            setCategory('General');
            setImage(null);
            loadProducts();
            setToast({ message: "Producto creado con éxito", type: 'success' });
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
            setToast({ message: "Producto eliminado del catálogo", type: 'success' });
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
            category: prod.category || 'General',
            image: null,
            removeImage: false
        });
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
                // To clear a file in DRF via FormData, we usually send an empty string
                formData.append('image', '');
            } else if (editData.image) {
                formData.append('image', editData.image);
            }
            
            await updateProduct(editingId, formData);
            setEditingId(null);
            setIsModalOpen(false);
            loadProducts();
            setToast({ message: "Producto actualizado", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    return (
        <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Gestión de Productos (Catálogo Base)</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Aquí das de alta los productos básicos del sistema con su foto.</p>
                </div>
                <button 
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="main-button"
                    style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(240, 62, 62, 0.2)' }}
                >
                    + NUEVO PRODUCTO
                </button>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="category-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                    {['Todas', ...new Set(products.map(p => p.category))].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: filterCategory === cat ? 'var(--admin-primary)' : '#ddd',
                                background: filterCategory === cat ? 'var(--admin-primary)' : 'white',
                                color: filterCategory === cat ? 'white' : '#666',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
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

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '800px', maxHeight: '90dvh', overflowY: 'auto', borderRadius: '24px', padding: '35px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} style={{ position: 'absolute', top: '25px', right: '25px', background: '#f1f3f5', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        
                        <h2 style={{ marginBottom: '10px' }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <p style={{ color: '#868e96', marginBottom: '30px' }}>{editingId ? 'Modifica los datos técnicos de la receta.' : 'Carga un nuevo producto al catálogo base de Duke.'}</p>

                        <form onSubmit={editingId ? handleEditSave : handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Nombre del Producto *</label>
                                    <input 
                                        type="text" 
                                        value={editingId ? editData.name : name} 
                                        onChange={e => editingId ? setEditData({...editData, name: e.target.value}) : setName(e.target.value)} 
                                        required 
                                        style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Categoría</label>
                                    <input 
                                        type="text" 
                                        value={editingId ? editData.category : category} 
                                        onChange={e => editingId ? setEditData({...editData, category: e.target.value}) : setCategory(e.target.value)} 
                                        placeholder="ej: Burgers, Bebidas..."
                                        style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Fotografía</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => editingId ? setEditData({...editData, image: e.target.files[0], removeImage: false}) : setImage(e.target.files[0])} 
                                        style={{ padding: '10px', fontSize: '0.85rem', width: '100%', borderRadius: '12px', border: '1px solid #ddd', background: '#f8f9fa' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Descripción Corta</label>
                                <textarea 
                                    value={editingId ? editData.description : description} 
                                    onChange={e => editingId ? setEditData({...editData, description: e.target.value}) : setDescription(e.target.value)} 
                                    style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Ingredientes</label>
                                <textarea 
                                    value={editingId ? editData.ingredients : ingredients} 
                                    onChange={e => editingId ? setEditData({...editData, ingredients: e.target.value}) : setIngredients(e.target.value)} 
                                    placeholder="Lechuga, Tomate, Cheddar..."
                                    style={{ padding: '14px', width: '100%', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', minHeight: '60px', resize: 'vertical' }}
                                />
                            </div>

                            {editingId && editData.name && products.find(p => p.id === editingId)?.image && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e03131', cursor: 'pointer', fontWeight: 'bold' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={editData.removeImage} 
                                        onChange={e => setEditData({...editData, removeImage: e.target.checked})} 
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    Eliminar fotografía actual
                                </label>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} style={{ flex: 1, padding: '15px', background: '#eee', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>CANCELAR</button>
                                <button type="submit" className="main-button" style={{ flex: 2, padding: '15px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(240, 62, 62, 0.3)' }}>
                                    {editingId ? '💾 GUARDAR CAMBIOS' : '🚀 CREAR PRODUCTO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '30px' }}>
                {loading ? <p>Cargando catálogo...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : products.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', color: '#888' }}>
                        No hay productos en el catálogo base. ¡Añade tu primera receta!
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {products.filter(p => {
                            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (p.ingredients && p.ingredients.toLowerCase().includes(searchTerm.toLowerCase()));
                            const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory;
                            return matchesSearch && matchesCategory;
                        }).map(prod => (
                            <div key={prod.id} style={{ 
                                background: '#fff', 
                                border: '1px solid #ebebeb', 
                                borderRadius: '16px', 
                                overflow: 'hidden', 
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ width: '100%', height: '220px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            {prod.category?.toUpperCase()}
                                        </div>
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
                                                    style={{ 
                                                        flex: 1, padding: '12px 0', background: '#f8f9fa', border: '1px solid #ddd', color: '#333', 
                                                        borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTrigger(prod.id)} 
                                                    style={{ 
                                                        padding: '12px 20px', background: '#fff5f5', border: '1px solid #ff4d4d', color: '#ff4d4d', 
                                                        borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s',
                                                        fontSize: '1rem'
                                                    }}
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
