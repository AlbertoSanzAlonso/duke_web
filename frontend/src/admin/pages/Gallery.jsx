import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Save, X } from 'lucide-react';
import { fetchGalleryImages, createGalleryImage, deleteGalleryImage, updateGalleryImage } from '../../services/api';

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newImage, setNewImage] = useState({ title: '', image: null, order: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        setLoading(true);
        try {
            const data = await fetchGalleryImages();
            setImages(data);
        } catch (error) {
            console.error("Error loading gallery:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newImage.image) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', newImage.title);
            formData.append('image', newImage.image);
            formData.append('order', newImage.order);
            await createGalleryImage(formData);
            setIsAdding(false);
            setNewImage({ title: '', image: null, order: 0 });
            loadImages();
        } catch (error) {
            alert("Error al subir imagen");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar esta imagen de la galería?")) return;
        try {
            await deleteGalleryImage(id);
            loadImages();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const handleReorder = async (id, newOrder) => {
        try {
            await updateGalleryImage(id, { order: newOrder });
            loadImages();
        } catch (error) {
            console.error("Error updating order:", error);
        }
    };

    return (
        <div className="admin-page-content">
            <div className="admin-page-header">
                <div>
                    <h2>Galería "Nosotros"</h2>
                    <p>Gestiona las imágenes que se muestran en la sección Nosotros de la web.</p>
                </div>
                <button className="add-btn" onClick={() => setIsAdding(true)}>
                    <Plus size={20} />
                    Añadir Imagen
                </button>
            </div>

            {isAdding && (
                <div className="modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Nueva Imagen</h3>
                            <button onClick={() => setIsAdding(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="admin-form">
                            <div className="form-group">
                                <label>Título (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={newImage.title} 
                                    onChange={e => setNewImage({...newImage, title: e.target.value})}
                                    placeholder="Ej: Interior del local"
                                />
                            </div>
                            <div className="form-group">
                                <label>Imagen *</label>
                                <input 
                                    type="file" 
                                    className="input-file"
                                    onChange={e => setNewImage({...newImage, image: e.target.files[0]})}
                                    required
                                    accept="image/*"
                                />
                            </div>
                            <div className="form-group">
                                <label>Orden de aparición</label>
                                <input 
                                    type="number" 
                                    value={newImage.order} 
                                    onChange={e => setNewImage({...newImage, order: parseInt(e.target.value) || 0})}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>Cancelar</button>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? 'Subiendo...' : 'Subir Imagen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-container">Cargando galería...</div>
            ) : (
                <div className="gallery-admin-grid">
                    {images.map((img) => (
                        <div key={img.id} className="gallery-admin-card">
                            <div className="gallery-admin-img">
                                <img src={img.image} alt={img.title} />
                            </div>
                            <div className="gallery-admin-info">
                                <input 
                                    type="text" 
                                    className="gallery-title-input"
                                    value={img.title || ''} 
                                    onChange={async (e) => {
                                      // Local update for responsiveness
                                      const newTitle = e.target.value;
                                      setImages(images.map(i => i.id === img.id ? {...i, title: newTitle} : i));
                                    }}
                                    onBlur={async (e) => {
                                      await updateGalleryImage(img.id, { title: e.target.value });
                                    }}
                                />
                                <div className="gallery-actions">
                                    <div className="order-control">
                                      <label>Orden:</label>
                                      <input 
                                          type="number" 
                                          value={img.order} 
                                          onChange={(e) => handleReorder(img.id, parseInt(e.target.value) || 0)}
                                      />
                                    </div>
                                    <button className="delete-icon-btn" onClick={() => handleDelete(img.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && (
                        <div className="empty-state">
                            <ImageIcon size={48} opacity={0.3} />
                            <p>No hay imágenes en la galería. Añade la primera.</p>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .gallery-admin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .gallery-admin-card {
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    border: 1px solid #eee;
                    display: flex;
                    flex-direction: column;
                }
                .gallery-admin-img {
                    height: 180px;
                    background: #f8f9fa;
                }
                .gallery-admin-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .gallery-admin-info {
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .gallery-title-input {
                    border: 1px solid transparent;
                    font-weight: 600;
                    font-size: 1rem;
                    padding: 5px;
                    width: 100%;
                }
                .gallery-title-input:hover, .gallery-title-input:focus {
                    border-color: #eee;
                    background: #fafafa;
                }
                .gallery-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .order-control {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #666;
                }
                .order-control input {
                    width: 50px;
                    padding: 4px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .delete-icon-btn {
                    background: #fee2e2;
                    color: #ef4444;
                    border: none;
                    border-radius: 6px;
                    padding: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .delete-icon-btn:hover {
                    background: #fecaca;
                }
                .input-file {
                    padding: 8px;
                    border: 1px dashed #ccc;
                    width: 100%;
                    cursor: pointer;
                }
                .empty-state {
                    grid-column: 1 / -1;
                    padding: 60px;
                    text-align: center;
                    background: #f9fafb;
                    border: 2px dashed #e5e7eb;
                    border-radius: 12px;
                    color: #9ca3af;
                }
            `}</style>
        </div>
    );
};

export default Gallery;
