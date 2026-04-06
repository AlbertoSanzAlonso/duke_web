import React, { useState, useEffect } from 'react';
import { fetchProducts, createProduct, deleteProduct, updateProduct } from '../../services/api';
import Toast from '../components/Toast';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '', image: null, removeImage: false });

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
            if (image) {
                formData.append('image', image);
            }

            await createProduct(formData);
            setName('');
            setDescription('');
            setImage(null);
            loadProducts();
            setToast({ message: "Producto creado con éxito", type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este producto de la base de datos?")) return;
        try {
            await deleteProduct(id);
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
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Aquí das de alta los productos básicos del sistema con su foto. Luego podrás añadirlos a "La Carta" para darles precio de venta.</p>

            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
                <input 
                    type="text" 
                    placeholder="Nombre del producto" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    style={{ padding: '10px', flex: 1, minWidth: '150px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <input 
                    type="text" 
                    placeholder="Descripción" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    style={{ padding: '10px', flex: 2, minWidth: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>Foto:</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setImage(e.target.files[0])} 
                        style={{ fontSize: '0.85rem' }}
                    />
                </div>
                <button type="submit" className="main-button" style={{ padding: '10px 20px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Crear Producto
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
                        {products.map(prod => (
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
                                            
                                            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '8px' }}>CAMBIAR IMAGEN</label>
                                                <input type="file" accept="image/*" onChange={e => setEditData({...editData, image: e.target.files[0], removeImage: false})} style={{ fontSize: '0.8rem', width: '100%' }} />
                                                
                                                {prod.image && (
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.85rem', color: '#e03131', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={editData.removeImage} 
                                                            onChange={e => setEditData({...editData, removeImage: e.target.checked})} 
                                                        />
                                                        Quitar fotografía actual
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
                                                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(prod.id)} 
                                                    style={{ 
                                                        padding: '10px 15px', background: '#fff', border: '1px solid #ff4d4d', color: '#ff4d4d', 
                                                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
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
        </div>
    );
}

export default Products;
