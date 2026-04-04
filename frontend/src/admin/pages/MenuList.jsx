import React, { useState, useEffect } from 'react';
import { fetchDishes, createDish, deleteDish } from '../../services/api';

function MenuList() {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form inputs state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);

    useEffect(() => {
        loadDishes();
    }, []);

    const loadDishes = async () => {
        try {
            setLoading(true);
            const data = await fetchDishes();
            setDishes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name || !price) return;
        
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('is_available', true);
            if (image) {
                formData.append('image', image);
            }

            await createDish(formData);
            // Clear form
            setName('');
            setDescription('');
            setPrice('');
            setImage(null);
            // Reload list
            loadDishes();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este plato?")) return;
        try {
            await deleteDish(id);
            loadDishes();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="admin-card">
            <h2>Gestión de la Carta</h2>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="Nombre del plato" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    style={{ padding: '8px', flex: 1, minWidth: '150px' }}
                />
                <input 
                    type="text" 
                    placeholder="Descripción resumida" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    style={{ padding: '8px', flex: 2, minWidth: '200px' }}
                />
                <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Precio" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    required 
                    style={{ padding: '8px', width: '100px' }}
                />
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block' }}>Subir Fotografía</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setImage(e.target.files[0])} 
                        style={{ padding: '4px', width: '100%' }}
                    />
                </div>
                <button type="submit" className="main-button" style={{ padding: '8px 16px', background: 'var(--admin-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Añadir Plato
                </button>
            </form>

            <div style={{ marginTop: '30px' }}>
                {loading ? <p>Cargando platos...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px', width: '80px' }}>Foto</th>
                                <th style={{ padding: '10px' }}>Nombre</th>
                                <th style={{ padding: '10px' }}>Descripción</th>
                                <th style={{ padding: '10px' }}>Precio</th>
                                <th style={{ padding: '10px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dishes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay platos en la carta.</td>
                                </tr>
                            ) : (
                                dishes.map(dish => (
                                    <tr key={dish.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            {dish.image ? (
                                                <img src={dish.image} alt={dish.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <div style={{ width: '60px', height: '60px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>Ninguna</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px' }}><strong>{dish.name}</strong></td>
                                        <td style={{ padding: '10px', color: '#666', fontSize: '0.9rem' }}>{dish.description}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>${dish.price}</td>
                                        <td style={{ padding: '10px' }}>
                                            <button onClick={() => handleDelete(dish.id)} style={{ padding: '6px 12px', background: '#e03131', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
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

export default MenuList;
