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
    const [image, setImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '', ingredients: '', image: null, removeImage: false });
    
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
            if (image) {
                formData.append('image', image);
            }

            await createProduct(formData);
            setName('');
            setDescription('');
            setIngredients('');
            setImage(null);
            loadProducts();
            setToast({ message: "Producto creado con éxito", type: 'success' });
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
            image: null,
            removeImage: false
        });
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editData.name);
            formData.append('description', editData.description);
            formData.append('ingredients', editData.ingredients);
            
            if (editData.removeImage) {
                // To clear a file in DRF via FormData, we usually send an empty string
                formData.append('image', '');
            } else if (editData.image) {
                formData.append('image', editData.image);
            }
            
            await updateProduct(editingId, formData);
            setEditingId(null);
            loadProducts();
            setToast({ message: "Producto actualizado", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    return (
        <div className="admin-card">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h2>Gestión de Productos (Catálogo Base)</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Aquí das de alta los productos básicos del sistema con su foto. Luego podrás añadirlos a "La Carta" para darles precio de venta.</p>
                
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar producto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.9rem', width: '100%' }}
                    />
                </div>
            </div>

            <form onSubmit={handleCreate} style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', 
                gap: '15px', 
                marginBottom: '30px', 
                background: '#fff', 
                padding: '25px', 
                borderRadius: '16px', 
                border: '1px solid #eee',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                alignItems: 'end'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Nombre del Producto *</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Hamburguesa Duke" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Descripción Corta</label>
                    <input 
                        type="text" 
                        placeholder="Ej: 200g carne, cheddar..." 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Ingredientes (Separados por coma)</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Lechuga, Tomate, Queso..." 
                        value={ingredients} 
                        onChange={e => setIngredients(e.target.value)} 
                        style={{ padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase' }}>Fotografía Principal</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setImage(e.target.files[0])} 
                        style={{ 
                            padding: '10px', 
                            fontSize: '0.85rem', 
                            width: '100%',
                            borderRadius: '10px', 
                            border: '1px solid #ddd', 
                            background: '#f8f9fa',
                            cursor: 'pointer'
                        }}
                    />
                </div>
                <button type="submit" className="main-button" style={{ 
                    padding: '12px 25px', 
                    background: 'var(--admin-primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    cursor: 'pointer', 
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    height: '48px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(240, 62, 62, 0.2)',
                    transition: 'all 0.2s'
                }}>
                    + CREAR PRODUCTO
                </button>
            </form>

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
                        {products.filter(p => 
                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (p.ingredients && p.ingredients.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).map(prod => (
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
                                    {editingId === prod.id ? (
                                        <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '15px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>NOMBRE</label>
                                                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required style={{ width: '100%', padding: '10px', fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid #ddd', borderRadius: '8px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>DESCRIPCIÓN</label>
                                                <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical', minHeight: '60px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>INGREDIENTES</label>
                                                <textarea value={editData.ingredients} onChange={e => setEditData({...editData, ingredients: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical', minHeight: '60px' }} />
                                            </div>
                                            
                                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#888', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Cambiar Fotografía</label>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={e => setEditData({...editData, image: e.target.files[0], removeImage: false})} 
                                                    style={{ 
                                                        fontSize: '0.85rem', 
                                                        width: '100%', 
                                                        boxSizing: 'border-box',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        background: '#fff',
                                                        cursor: 'pointer'
                                                    }} 
                                                />
                                                
                                                {prod.image && (
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '0.85rem', color: '#e03131', cursor: 'pointer', fontWeight: '700' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={editData.removeImage} 
                                                            onChange={e => setEditData({...editData, removeImage: e.target.checked})} 
                                                            style={{ width: '16px', height: '16px' }}
                                                        />
                                                        Eliminar fotografía actual
                                                    </label>
                                                )}
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                                                <button type="submit" style={{ flex: 2, padding: '12px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
                                                <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, padding: '12px', background: '#eee', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: '#222' }}>{prod.name}</h3>
                                            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.4', flex: '1' }}>{prod.description || 'Sin descripción.'}</p>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button 
                                                    onClick={() => handleEditStart(prod)} 
                                                    style={{ 
                                                        flex: 1, padding: '10px 0', background: '#fff', border: '1px solid #ddd', color: '#333', 
                                                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s',
                                                        fontSize: '1.1rem'
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTrigger(prod.id)} 
                                                    style={{ 
                                                        padding: '10px 15px', background: '#fff', border: '1px solid #ff4d4d', color: '#ff4d4d', 
                                                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s',
                                                        fontSize: '1.1rem'
                                                    }}
                                                >
                                                    Retirar
                                                </button>
                                            </div>
                                        </>
                                    )}
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
