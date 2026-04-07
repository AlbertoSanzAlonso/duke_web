import React, { useState, useEffect } from 'react';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { fetchGalleryImages, createGalleryImage, deleteGalleryImage, updateGalleryImage } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Image as ImageIcon, Plus, Trash2, X, AlertTriangle, Eye, EyeOff, Move } from 'lucide-react';

const SortableItem = ({ img, confirmDelete, handleToggleActive, handleUpdateTitle }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.4 : (!img.is_active ? 0.6 : 1),
        background: '#fff', 
        borderRadius: '15px', 
        overflow: 'hidden', 
        boxShadow: isDragging ? '0 15px 30px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
        border: isDragging ? '2px solid var(--admin-primary)' : '1px solid #eee',
        position: 'relative'
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{ height: '220px', background: '#eee', position: 'relative' }}>
                <img src={img.image} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => handleToggleActive(img.id, img.is_active)}
                        style={{
                            background: img.is_active ? '#40c057' : '#e31837',
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
                        {img.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>

                <div 
                    {...attributes} 
                    {...listeners} 
                    style={{ 
                        position: 'absolute', bottom: '12px', left: '12px', 
                        background: 'rgba(0,0,0,0.8)', color: 'white', 
                        width: '36px', height: '36px', 
                        borderRadius: '50%', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'grab',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        border: '1.5px solid rgba(255,255,255,0.4)',
                        zIndex: 20
                    }}
                >
                    <Move size={18} />
                </div>

                {!img.is_active && (
                    <div style={{ 
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                        background: 'rgba(0,0,0,0.4)', color: 'white', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', fontWeight: 'bold', pointerEvents: 'none'
                    }}>
                        PAUSADA (OCULTA)
                    </div>
                )}
            </div>
            <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <input 
                            type="text" 
                            defaultValue={img.title} 
                            onBlur={(e) => handleUpdateTitle(img.id, e.target.value)}
                            placeholder="Añadir título..."
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', background: '#fcfcfc' }}
                        />
                    </div>
                    <button 
                        onClick={() => confirmDelete({ id: img.id, title: img.title })}
                        style={{ padding: '8px', background: '#fff5f5', color: '#f03e3e', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const Gallery = () => {
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [isAddingImg, setIsAddingImg] = useState(false);
    const [newImage, setNewImage] = useState({ title: '', image: null, order: 0 });
    const [imgSaving, setImgSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setGallery((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);
                
                // Optimized backend update
                saveOrder(newItems);
                
                return newItems;
            });
        }
    };

    const saveOrder = async (newItems) => {
        try {
            const updates = newItems.map((item, idx) => ({ id: item.id, order: idx }));
            await Promise.all(updates.map(u => updateGalleryImage(u.id, { order: u.order })));
            setToast({ message: "Orden actualizado", type: 'success' });
        } catch (error) {
            console.error("Error saving gallery order:", error);
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
            formData.append('order', gallery.length);
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

            <p style={{ color: '#666', marginBottom: '40px' }}>Reordena las fotos arrastrando desde el icono de las flechas. El orden se guarda automáticamente.</p>

            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={gallery.map(i => i.id)}
                    strategy={rectSortingStrategy}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                        {gallery.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: '#f8f9fa', borderRadius: '15px', color: '#999' }}>
                                No hay fotos en la galería todavía.
                            </div>
                        ) : (
                            gallery.map((img) => (
                                <SortableItem 
                                    key={img.id} 
                                    img={img} 
                                    confirmDelete={setConfirmDelete}
                                    handleToggleActive={handleToggleActive}
                                    handleUpdateTitle={handleUpdateTitle}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DndContext>

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
