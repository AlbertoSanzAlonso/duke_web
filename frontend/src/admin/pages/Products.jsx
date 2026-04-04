import React, { useState, useEffect } from 'react';
import { fetchProducts, createProduct, deleteProduct, updateProduct } from '../../services/api';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '', image: null });

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
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este producto de la base de datos?")) return;
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEditStart = (prod) => {
        setEditingId(prod.id);
        setEditData({ name: prod.name, description: prod.description, image: null });
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editData.name);
            formData.append('description', editData.description);
            if (editData.image) {
                formData.append('image', editData.image);
            }
            await updateProduct(editingId, formData);
            setEditingId(null);
            loadProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="admin-card">
            <h2>Gestión de Productos (Catálogo Base)</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Aquí das de alta los productos básicos del sistema con su foto. Luego podrás añadirlos a "La Carta" para darles precio de venta.</p>

            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="Nombre del producto" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    style={{ padding: '8px', flex: 1, minWidth: '150px' }}
                />
                <input 
                    type="text" 
                    placeholder="Descripción" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    style={{ padding: '8px', flex: 2, minWidth: '200px' }}
                />
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block' }}>Fotografía</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setImage(e.target.files[0])} 
                        style={{ padding: '4px', width: '100%' }}
                    />
                </div>
                <button type="submit" className="main-button" style={{ padding: '8px 16px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Crear Producto
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
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {products.map(prod => (
                            <div key={prod.id} style={{ 
                                background: '#fff', 
                                border: '1px solid #ebebeb', 
                                borderRadius: '12px', 
                                overflow: 'hidden', 
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ width: '100%', height: '220px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: '#999', fontSize: '0.9rem' }}>Sin Fotografía</span>
                                    )}
                                </div>
                                <div style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                                    {editingId === prod.id ? (
                                        <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '10px' }}>
                                            <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required style={{ padding: '8px', fontSize: '1.2rem', fontWeight: 'bold', border: '1px solid #ccc', borderRadius: '4px' }} />
                                            <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} style={{ padding: '8px', flex: '1', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', minHeight: '60px' }} />
                                            <input type="file" accept="image/*" onChange={e => setEditData({...editData, image: e.target.files[0]})} style={{ fontSize: '0.8rem' }} />
                                            
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                <button type="submit" style={{ flex: 1, padding: '8px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
                                                <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, padding: '8px', background: '#ccc', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#222' }}>{prod.name}</h3>
                                            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.95rem', lineHeight: '1.4', flex: '1' }}>{prod.description}</p>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button 
                                                    onClick={() => handleEditStart(prod)} 
                                                    style={{ 
                                                        flex: 1, padding: '10px 0', background: '#fff', border: '1px solid var(--admin-primary)', color: 'var(--admin-primary)', 
                                                        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(prod.id)} 
                                                    style={{ 
                                                        flex: 1, padding: '10px 0', background: '#fff', border: '1px solid #ff4d4d', color: '#ff4d4d', 
                                                        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
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
