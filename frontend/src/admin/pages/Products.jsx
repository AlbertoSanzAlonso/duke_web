import React, { useState, useEffect } from 'react';
import { fetchProducts, createProduct, deleteProduct } from '../../services/api';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);

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
                {loading ? <p>Cargando catálogo...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px', width: '80px' }}>Foto</th>
                                <th style={{ padding: '10px' }}>Nombre</th>
                                <th style={{ padding: '10px' }}>Descripción</th>
                                <th style={{ padding: '10px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No hay productos en el catálogo base.</td>
                                </tr>
                            ) : (
                                products.map(prod => (
                                    <tr key={prod.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            {prod.image ? (
                                                <img src={prod.image} alt={prod.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <div style={{ width: '60px', height: '60px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>Ninguna</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px' }}><strong>{prod.name}</strong></td>
                                        <td style={{ padding: '10px', color: '#666', fontSize: '0.9rem' }}>{prod.description}</td>
                                        <td style={{ padding: '10px' }}>
                                            <button onClick={() => handleDelete(prod.id)} style={{ padding: '6px 12px', background: '#e03131', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Products;
