import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSetting, fetchGalleryImages, createGalleryImage, deleteGalleryImage, updateGalleryImage } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Settings as SettingsIcon, Save, Truck, Clock, Image as ImageIcon, Plus, Trash2, X, Calendar } from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('delivery');
    const [settings, setSettings] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);

    // Gallery state
    const [isAddingImg, setIsAddingImg] = useState(false);
    const [newImage, setNewImage] = useState({ title: '', image: null, order: 0 });
    const [imgSaving, setImgSaving] = useState(false);

    const DAYS = [
        { id: '1', name: 'Lunes' },
        { id: '2', name: 'Martes' },
        { id: '3', name: 'Miércoles' },
        { id: '4', name: 'Jueves' },
        { id: '5', name: 'Viernes' },
        { id: '6', name: 'Sábado' },
        { id: '7', name: 'Domingo' }
    ];

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [settingsData, galleryData] = await Promise.all([
                fetchSettings(),
                fetchGalleryImages()
            ]);
            setSettings(settingsData);
            setGallery(galleryData);
        } catch (error) {
            console.error("Error loading settings/gallery:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await Promise.all(settings.map(s => updateSetting(s.key, s.value)));
            setToast({ message: 'Configuración guardada correctamente', type: 'success' });
            loadAllData();
        } catch (err) {
            setToast({ message: 'Error al actualizar configuraciones', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // Gallery handlers
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
            const galleryData = await fetchGalleryImages();
            setGallery(galleryData);
            setToast({ message: 'Imagen añadida con éxito', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al subir imagen', type: 'error' });
        } finally {
            setImgSaving(false);
        }
    };

    const handleDeleteImage = async (id) => {
        if (!window.confirm("¿Eliminar esta imagen de la galería?")) return;
        try {
            await deleteGalleryImage(id);
            setGallery(gallery.filter(i => i.id !== id));
            setToast({ message: 'Imagen eliminada', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al eliminar', type: 'error' });
        }
    };

    const handleReorderImage = async (id, newOrder) => {
        try {
            await updateGalleryImage(id, { order: newOrder });
            setGallery(prev => prev.map(i => i.id === id ? { ...i, order: newOrder } : i).sort((a,b) => a.order - b.order));
        } catch (error) {
            console.error("Error updating order:", error);
        }
    };

    const toggleDay = (dayId) => {
        const openingDays = settings.find(s => s.key === 'opening_days')?.value || '';
        let daysArray = openingDays ? openingDays.split(',') : [];
        if (daysArray.includes(dayId)) {
            daysArray = daysArray.filter(d => d !== dayId);
        } else {
            daysArray.push(dayId);
        }
        handleSettingChange('opening_days', daysArray.sort().join(','));
    };

    if (loading) return <LoadingScreen />;

    // Separate settings by category
    const deliverySettings = settings.filter(s => s.key.startsWith('delivery_'));
    const openingSettings = settings.filter(s => s.key.startsWith('opening_') || s.key.startsWith('closing_'));

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <SettingsIcon size={32} color="#333" />
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Configuración</h2>
            </div>

            <div className="settings-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick={() => setActiveTab('delivery')}
                    className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
                    style={tabBtnStyle(activeTab === 'delivery')}
                >
                    <Truck size={18} /> Tarifas de Envío
                </button>
                <button 
                    onClick={() => setActiveTab('hours')}
                    className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`}
                    style={tabBtnStyle(activeTab === 'hours')}
                >
                    <Clock size={18} /> Horarios
                </button>
                <button 
                    onClick={() => setActiveTab('gallery')}
                    className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                    style={tabBtnStyle(activeTab === 'gallery')}
                >
                    <ImageIcon size={18} /> Galería Locales
                </button>
            </div>

            <div className="admin-card">
                {activeTab === 'delivery' && (
                    <div className="tab-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <Truck size={22} color="#f03e3e" />
                            <h3 style={{ margin: 0 }}>Tarifas de Envío (Cadetería)</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {deliverySettings.map(s => (
                                <div key={s.id} className="setting-field">
                                    <label style={labelStyle}>{s.description || s.key}</label>
                                    <div style={{ position: 'relative' }}>
                                        {!s.key.includes('max_km') && <span style={priceSymbolStyle}>$</span>}
                                        <input 
                                            type="number"
                                            value={s.value}
                                            onChange={e => handleSettingChange(s.key, e.target.value)}
                                            style={inputStyle(s.key.includes('max_km'))}
                                        />
                                        {s.key.includes('max_km') && <span style={kmTextStyle}>KM</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={saveSettings} style={saveButtonStyle} disabled={isSaving}>
                            <Save size={20} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR TARIFAS'}
                        </button>
                    </div>
                )}

                {activeTab === 'hours' && (
                    <div className="tab-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <Clock size={22} color="#f03e3e" />
                            <h3 style={{ margin: 0 }}>Horarios de Apertura</h3>
                        </div>
                        
                        <div style={{ marginBottom: '30px' }}>
                            <label style={labelStyle}>Días de Atención</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                {DAYS.map(day => {
                                    const isActive = (settings.find(s => s.key === 'opening_days')?.value || '').split(',').includes(day.id);
                                    return (
                                        <button 
                                            key={day.id}
                                            onClick={() => toggleDay(day.id)}
                                            style={{
                                                padding: '10px 15px',
                                                borderRadius: '8px',
                                                border: isActive ? '2px solid #f03e3e' : '2px solid #ddd',
                                                background: isActive ? '#fff5f5' : '#fff',
                                                color: isActive ? '#f03e3e' : '#666',
                                                fontWeight: isActive ? '900' : '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Calendar size={16} /> {day.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <div className="setting-field">
                                <label style={labelStyle}>Hora de Apertura</label>
                                <input 
                                    type="time"
                                    value={settings.find(s => s.key === 'opening_time')?.value || '20:00'}
                                    onChange={e => handleSettingChange('opening_time', e.target.value)}
                                    style={timeInputStyle}
                                />
                            </div>
                            <div className="setting-field">
                                <label style={labelStyle}>Hora de Cierre</label>
                                <input 
                                    type="time"
                                    value={settings.find(s => s.key === 'closing_time')?.value || '00:00'}
                                    onChange={e => handleSettingChange('closing_time', e.target.value)}
                                    style={timeInputStyle}
                                />
                            </div>
                        </div>

                        <button onClick={saveSettings} style={saveButtonStyle} disabled={isSaving}>
                            <Save size={20} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR HORARIOS'}
                        </button>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="tab-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ImageIcon size={22} color="#f03e3e" />
                                <h3 style={{ margin: 0 }}>Galería del Local</h3>
                            </div>
                            <button className="add-btn" onClick={() => setIsAddingImg(true)} style={addImgBtnStyle}>
                                <Plus size={18} /> Añadir Foto
                            </button>
                        </div>

                        <div className="gallery-admin-grid" style={galleryGridStyle}>
                            {gallery.map(img => (
                                <div key={img.id} style={galleryCardStyle}>
                                    <div style={galleryImgContainerStyle}>
                                        <img src={img.image} alt={img.title} style={galleryImgStyle} />
                                    </div>
                                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input 
                                            type="text"
                                            value={img.title || ''}
                                            placeholder="Sin título"
                                            onChange={(e) => setGallery(gallery.map(i => i.id === img.id ? {...i, title: e.target.value} : i))}
                                            onBlur={async (e) => await updateGalleryImage(img.id, { title: e.target.value })}
                                            style={galleryTitleInputStyle}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                                                Orden: 
                                                <input 
                                                    type="number"
                                                    value={img.order}
                                                    onChange={(e) => handleReorderImage(img.id, parseInt(e.target.value) || 0)}
                                                    style={orderInputStyle}
                                                />
                                            </div>
                                            <button onClick={() => handleDeleteImage(img.id)} style={deleteBtnStyle}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {gallery.length === 0 && <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center' }}>No hay imágenes cargadas.</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para añadir imagen */}
            {isAddingImg && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="admin-modal" style={modalStyle}>
                        <div className="modal-header" style={modalHeaderStyle}>
                            <h3>Nueva Imagen del Local</h3>
                            <button onClick={() => setIsAddingImg(false)} style={closeBtnStyle}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddImage} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={modalLabelStyle}>Título (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={newImage.title}
                                    placeholder="Ej: Salón Principal"
                                    onChange={e => setNewImage({...newImage, title: e.target.value})}
                                    style={modalInputStyle}
                                />
                            </div>
                            <div>
                                <label style={modalLabelStyle}>Archivo de Imagen *</label>
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setNewImage({...newImage, image: e.target.files[0]})}
                                    style={modalInputStyle}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsAddingImg(false)} style={cancelBtnStyle}>Cancelar</button>
                                <button type="submit" disabled={imgSaving} style={saveImgBtnStyle}>
                                    {imgSaving ? 'Subiendo...' : 'Publicar Imagen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const tabBtnStyle = (active) => ({
    padding: '12px 20px',
    border: 'none',
    borderRadius: '10px',
    background: active ? '#f03e3e' : '#fff',
    color: active ? '#fff' : '#666',
    fontWeight: active ? '700' : '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: active ? '0 4px 12px rgba(240, 62, 62, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
});

const labelStyle = { fontWeight: 'bold', fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', marginBottom: '8px', display: 'block' };

const inputStyle = (isKm) => ({
    width: '100%',
    padding: `15px 15px 15px ${isKm ? '15px' : '35px'}`,
    borderRadius: '10px',
    border: '2px solid #ddd',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#333'
});

const timeInputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #ddd',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    fontFamily: 'inherit'
};

const priceSymbolStyle = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '1.2rem', fontWeight: 'bold' };
const kmTextStyle = { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '1rem', fontWeight: 'bold' };

const saveButtonStyle = {
    width: '100%',
    padding: '18px',
    background: '#f03e3e',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '30px',
    boxShadow: '0 6px 15px rgba(240, 62, 62, 0.3)'
};

const addImgBtnStyle = { background: '#333', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' };

const galleryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' };

const galleryCardStyle = { background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const galleryImgContainerStyle = { height: '140px', background: '#f8f9fa' };
const galleryImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const galleryTitleInputStyle = { border: 'none', borderBottom: '1px solid transparent', width: '100%', padding: '4px', fontSize: '0.9rem', fontWeight: '600' };
const orderInputStyle = { width: '45px', padding: '2px 5px', border: '1px solid #ddd', borderRadius: '4px', marginLeft: '5px' };
const deleteBtnStyle = { background: '#fff5f5', color: '#f03e3e', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' };

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' };
const modalStyle = { background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '15px', overflow: 'hidden' };
const modalHeaderStyle = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#666' };
const modalLabelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' };
const modalInputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' };
const cancelBtnStyle = { flex: 1, padding: '12px', background: '#f8f9fa', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const saveImgBtnStyle = { flex: 1, padding: '12px', background: '#f03e3e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

export default Settings;
