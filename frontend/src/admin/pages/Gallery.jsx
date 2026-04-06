import React, { useState, useEffect } from 'react';
import { fetchGalleryImages, createGalleryImage, deleteGalleryImage, updateGalleryImage } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Image as ImageIcon, Plus, Trash2, X, AlertTriangle, Save } from 'lucide-react';

const Gallery = () => {
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [isAddingImg, setIsAddingImg] = useState(false);
    const [newImage, setNewImage] = useState({ title: '', image: null, order: 0 });
    const [imgSaving, setImgSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchGalleryImages();
            setGallery(data.sort((a,b) => a.order - b.order));
        } catch (error) {
            setToast({ message: 'Error al cargar la galería', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddImage = async (e) => {
        e.preventDefault();
        if (!newImage.image) return;
        setImgSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', newImage.title);
            formData.append('image', newImage.image);
            formData.append('order', newImage.order);
            await createGalleryImage(formData);
            setIsAddingImg(false);
            setNewImage({ title: '', image: null, order: 0 });
            loadData();
            setToast({ message: 'Imagen añadida con éxito', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al subir imagen', type: 'error' });
        } finally {
            setImgSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteGalleryImage(id);
            setGallery(gallery.filter(i => i.id !== id));
            setToast({ message: 'Imagen eliminada', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al eliminar', type: 'error' });
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleUpdateTitle = async (id, title) => {
        try {
            await updateGalleryImage(id, { title });
            setGallery(gallery.map(i => i.id === id ? {...i, title} : i));
        } catch (error) {
            setToast({ message: 'Error al actualizar título', type: 'error' });
        }
    };

    const handleUpdateOrder = async (id, order) => {
        try {
            await updateGalleryImage(id, { order });
            loadData(); // Reload and sort
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await updateGalleryImage(id, { is_active: !currentStatus });
            setGallery(gallery.map(i => i.id === id ? {...i, is_active: !currentStatus} : i));
            setToast({ message: !currentStatus ? 'Imagen visible en la web' : 'Imagen oculta al público', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al cambiar visibilidad', type: 'error' });
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <ImageIcon size={32} color="var(--admin-primary)" />
                    <h2 style={{ margin: 0, color: '#333' }}>Galería Local</h2>
                </div>
                <button 
                    onClick={() => setIsAddingImg(true)} 
                    style={{
                        background: 'var(--admin-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0 25px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        height: '45px',
                        boxShadow: '0 4px 12px rgba(240, 62, 62, 0.2)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.3s ease',
                        minWidth: 'max-content'
                    }}
                >
                    <Plus size={20} strokeWidth={3} /> AÑADIR FOTO
                </button>
            </div>

            <p style={{ color: '#666', marginBottom: '40px' }}>Estas son las fotos que se muestran en el carrusel de la página de inicio (Galería del Local).</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {gallery.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: '#f8f9fa', borderRadius: '15px', color: '#999' }}>
                        No hay fotos en la galería todavía.
                    </div>
                ) : (
                    gallery.map(img => (
                        <div key={img.id} style={{ 
                            background: '#fff', 
                            borderRadius: '15px', 
                            overflow: 'hidden', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: '1px solid #eee',
                            opacity: img.is_active ? 1 : 0.6,
                            transition: 'opacity 0.2s'
                        }}>
                            <div style={{ height: '220px', background: '#eee', position: 'relative' }}>
                                <img src={img.image} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ 
                                    position: 'absolute', top: '10px', left: '10px', 
                                    background: 'rgba(0,0,0,0.6)', color: 'white', 
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem',
                                    zIndex: 2
                                }}>
                                    Orden: {img.order}
                                </div>
                                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleToggleActive(img.id, img.is_active)}
                                        style={{
                                            background: img.is_active ? '#40c057' : '#adb5bd',
                                            color: 'white',
                                            border: 'none',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                        }}
                                        title={img.is_active ? "Ocultar de la Web" : "Hacer Visible"}
                                    >
                                        {img.is_active ? <ImageIcon size={18} /> : <X size={18} />}
                                    </button>
                                </div>
                                {!img.is_active && (
                                    <div style={{ 
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                        background: 'rgba(0,0,0,0.4)', color: 'white', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', fontWeight: 'bold' 
                                    }}>
                                        PAUSADA (OCULTA)
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Título</label>
                                    <input 
                                        type="text" 
                                        defaultValue={img.title} 
                                        onBlur={(e) => handleUpdateTitle(img.id, e.target.value)}
                                        placeholder="Sin título"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Posición</label>
                                        <input 
                                            type="number" 
                                            value={img.order} 
                                            onChange={(e) => setGallery(gallery.map(i => i.id === img.id ? {...i, order: parseInt(e.target.value)} : i))}
                                            onBlur={(e) => handleUpdateOrder(img.id, parseInt(e.target.value) || 0)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setConfirmDelete({ id: img.id, title: img.title })}
                                        style={{ alignSelf: 'flex-end', padding: '10px', background: '#fff5f5', color: '#f03e3e', border: '1px solid #ffe3e3', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para añadir imagen */}
            {isAddingImg && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '15px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Nueva Imagen del Local</h3>
                            <button onClick={() => setIsAddingImg(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddImage} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>Título (Opcional)</label>
                                <input type="text" value={newImage.title} placeholder="Ej: Salón Principal" onChange={e => setNewImage({...newImage, title: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '800', marginBottom: '8px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Archivo de Imagen *</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={e => setNewImage({...newImage, image: e.target.files[0]})} 
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '8px', 
                                        fontSize: '0.9rem',
                                        background: '#f8f9fa',
                                        cursor: 'pointer' 
                                    }} 
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsAddingImg(false)} style={{ flex: 1, padding: '12px', background: '#f8f9fa', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={imgSaving} style={{ flex: 1, padding: '12px', background: 'var(--admin-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{imgSaving ? 'Subiendo...' : 'Publicar Imagen'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '15px', padding: '30px', textAlign: 'center' }}>
                        <div style={{ color: '#f03e3e', marginBottom: '15px' }}><AlertTriangle size={48} style={{ margin: '0 auto' }} /></div>
                        <h3 style={{ margin: '0 0 10px 0' }}>¿Estás seguro?</h3>
                        <p style={{ color: '#666', marginBottom: '25px' }}>Vas a eliminar la imagen <strong>{confirmDelete.title || 'sin título'}</strong>.</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', background: '#f8f9fa', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>CANCELAR</button>
                            <button onClick={() => handleDelete(confirmDelete.id)} style={{ flex: 1, padding: '12px', background: '#f03e3e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>SÍ, ELIMINAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
