import React, { useState, useEffect } from 'react';
import { 
    fetchOpeningHours, updateOpeningHour, 
    fetchDeliveryRates, updateDeliveryRates, 
    fetchGalleryImages, createGalleryImage, deleteGalleryImage, updateGalleryImage 
} from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Settings as SettingsIcon, Save, Truck, Clock, Image as ImageIcon, Plus, Trash2, X, AlertTriangle } from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('delivery');
    const [openingHours, setOpeningHours] = useState([]);
    const [deliveryRates, setDeliveryRates] = useState({ base_price: 0, km_price: 0, max_km: 0 });
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, title }

    // Gallery state
    const [isAddingImg, setIsAddingImg] = useState(false);
    const [newImage, setNewImage] = useState({ title: '', image: null, order: 0 });
    const [imgSaving, setImgSaving] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [hoursData, ratesData, galleryData] = await Promise.all([
                fetchOpeningHours(),
                fetchDeliveryRates(),
                fetchGalleryImages()
            ]);
            setOpeningHours(hoursData);
            setDeliveryRates(ratesData);
            setGallery(galleryData);
        } catch (error) {
            console.error("Error loading settings:", error);
            setToast({ message: 'Error al cargar los datos', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = (field, value) => {
        setDeliveryRates(prev => ({ ...prev, [field]: value }));
    };

    const handleHourChange = (id, field, value) => {
        setOpeningHours(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const saveRates = async () => {
        setIsSaving(true);
        try {
            await updateDeliveryRates(deliveryRates);
            setToast({ message: 'Tarifas guardadas correctamente', type: 'success' });
        } catch (err) {
            setToast({ message: 'Error al actualizar tarifas', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const saveAllHours = async () => {
        setIsSaving(true);
        try {
            await Promise.all(openingHours.map(h => updateOpeningHour(h.id, h)));
            setToast({ message: 'Todos los horarios guardados', type: 'success' });
        } catch (err) {
            setToast({ message: 'Error al guardar horarios', type: 'error' });
        } finally {
            setIsSaving(false);
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
            setGallery(await fetchGalleryImages());
            setToast({ message: 'Imagen añadida con éxito', type: 'success' });
        } catch (error) {
            setToast({ message: 'Error al subir imagen', type: 'error' });
        } finally {
            setImgSaving(false);
        }
    };

    const executeDelete = async () => {
        if (!confirmDelete) return;
        try {
            if (confirmDelete.type === 'image') {
                await deleteGalleryImage(confirmDelete.id);
                setGallery(gallery.filter(i => i.id !== confirmDelete.id));
                setToast({ message: 'Imagen eliminada', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Error al eliminar', type: 'error' });
        } finally {
            setConfirmDelete(null);
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

    if (loading) return <LoadingScreen />;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <SettingsIcon size={32} color="#333" />
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Configuración Duke</h2>
            </div>

            <div className="settings-tabs-container" style={{ overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
                <div className="settings-tabs" style={{ display: 'flex', gap: '10px', minWidth: 'max-content' }}>
                    <button onClick={() => setActiveTab('delivery')} className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`} style={tabBtnStyle(activeTab === 'delivery')}>
                        <Truck size={18} /> Tarifas Envío
                    </button>
                    <button onClick={() => setActiveTab('hours')} className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`} style={tabBtnStyle(activeTab === 'hours')}>
                        <Clock size={18} /> Tabla Horarios
                    </button>
                    <button onClick={() => setActiveTab('gallery')} className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`} style={tabBtnStyle(activeTab === 'gallery')}>
                        <ImageIcon size={18} /> Galería Local
                    </button>
                </div>
            </div>

            <div className="admin-card">
                {activeTab === 'delivery' && (
                    <div className="tab-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Truck size={32} color="#f03e3e" />
                                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Parámetros de Envío</h2>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                            <div className="setting-field">
                                <label style={labelStyle}>Precio Base Envío</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={priceSymbolStyle}>$</span>
                                    <input type="number" value={deliveryRates.base_price} onChange={e => handleRateChange('base_price', e.target.value)} style={inputStyle(false)} />
                                </div>
                            </div>
                            <div className="setting-field">
                                <label style={labelStyle}>Plus por KM Recorrido</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={priceSymbolStyle}>$</span>
                                    <input type="number" value={deliveryRates.km_price} onChange={e => handleRateChange('km_price', e.target.value)} style={inputStyle(false)} />
                                </div>
                            </div>
                            <div className="setting-field">
                                <label style={labelStyle}>Distancia Máxima (GPS)</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" value={deliveryRates.max_km} onChange={e => handleRateChange('max_km', e.target.value)} style={inputStyle(true)} />
                                    <span style={kmTextStyle}>KM</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={saveRates} style={saveButtonStyle} disabled={isSaving}>
                            <Save size={20} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR TARIFAS'}
                        </button>
                    </div>
                )}

                {activeTab === 'hours' && (
                    <div className="tab-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Clock size={32} color="#f03e3e" />
                                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Gestión de Horarios</h2>
                            </div>
                            <button 
                                onClick={async () => {
                                    if(window.confirm("¿Deseas restaurar los horarios por defecto?")) {
                                        setLoading(true);
                                        const response = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api/setup-admin-super/`);
                                        const data = await response.json();
                                        setToast({ message: "Datos restaurados con éxito", type: 'success' });
                                        loadAllData();
                                    }
                                }}
                                style={{ ...addImgBtnStyle, background: '#f8f9fa', border: '1px solid #ddd', color: '#444', boxShadow: 'none' }}
                            >
                                <AlertTriangle size={20} /> Restaurar Tabla
                            </button>
                        </div>
                        
                        {openingHours.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', background: '#f8f9fa', borderRadius: '12px' }}>
                                <p style={{ color: '#888' }}>No hay horarios en la base de datos.</p>
                                <button onClick={() => setActiveTab('hours')} className="restore-btn" style={{ color: '#f03e3e', fontWeight: 'bold' }}>Haz click en Restaurar Tabla arriba</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {openingHours.map(hour => (
                                    <div key={hour.id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        background: hour.is_open ? '#fff' : '#f8f9fa',
                                        padding: '15px', 
                                        border: '1px solid #eee',
                                        borderRadius: '12px',
                                        gap: '15px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '120px' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', 
                                                background: hour.is_open ? '#f03e3e' : '#ccc', color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                            }}>
                                                {hour.day_name?.charAt(0) || '?'}
                                            </div>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{hour.day_name}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '250px' }}>
                                            <input 
                                                type="time" 
                                                value={hour.opening_time} 
                                                disabled={!hour.is_open}
                                                onChange={e => handleHourChange(hour.id, 'opening_time', e.target.value)}
                                                style={{ ...timeInputStyle, opacity: hour.is_open ? 1 : 0.5, border: '1px solid #ddd', fontSize: '1rem', padding: '8px' }}
                                            />
                                            <span style={{ color: '#888' }}>a</span>
                                            <input 
                                                type="time" 
                                                value={hour.closing_time} 
                                                disabled={!hour.is_open}
                                                onChange={e => handleHourChange(hour.id, 'closing_time', e.target.value)}
                                                style={{ ...timeInputStyle, opacity: hour.is_open ? 1 : 0.5, border: '1px solid #ddd', fontSize: '1rem', padding: '8px' }}
                                            />
                                        </div>

                                        <button 
                                            onClick={() => handleHourChange(hour.id, 'is_open', !hour.is_open)}
                                            style={{
                                                padding: '8px 15px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: hour.is_open ? '#ebfbee' : '#fff5f5',
                                                color: hour.is_open ? '#2b8a3e' : '#f03e3e',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {hour.is_open ? 'ABIERTO' : 'CERRADO'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={saveAllHours} style={saveButtonStyle} disabled={isSaving}>
                            <Save size={20} /> {isSaving ? 'GUARDANDO MESA DE HORARIOS...' : 'GUARDAR TODA LA TABLA'}
                        </button>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="tab-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <ImageIcon size={32} color="#f03e3e" />
                                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Galería del Local</h2>
                            </div>
                            <button onClick={() => setIsAddingImg(true)} style={addImgBtnStyle}>
                                <Plus size={20} /> Añadir Foto
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
                                                <input type="number" value={img.order} onChange={(e) => handleReorderImage(img.id, parseInt(e.target.value) || 0)} style={orderInputStyle} />
                                            </div>
                                            <button onClick={() => setConfirmDelete({ type: 'image', id: img.id, title: img.title })} style={deleteBtnStyle}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Confirms */}
            {confirmDelete && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div className="admin-modal" style={{ ...modalStyle, maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ padding: '30px' }}>
                            <div style={{ color: '#f03e3e', marginBottom: '15px' }}><AlertTriangle size={48} style={{ margin: '0 auto' }} /></div>
                            <h3>¿Estás seguro?</h3>
                            <p style={{ color: '#666' }}>Vas a eliminar la imagen <strong>{confirmDelete.title || 'sin título'}</strong>. Esta acción no se puede deshacer.</p>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                                <button onClick={() => setConfirmDelete(null)} style={cancelBtnStyle}>CANCELAR</button>
                                <button onClick={executeDelete} style={{ ...saveImgBtnStyle, background: '#f03e3e' }}>SÍ, ELIMINAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                <input type="text" value={newImage.title} placeholder="Ej: Salón Principal" onChange={e => setNewImage({...newImage, title: e.target.value})} style={modalInputStyle} />
                            </div>
                            <div>
                                <label style={modalLabelStyle}>Archivo de Imagen *</label>
                                <input type="file" accept="image/*" onChange={e => setNewImage({...newImage, image: e.target.files[0]})} style={modalInputStyle} required />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setIsAddingImg(false)} style={cancelBtnStyle}>Cancelar</button>
                                <button type="submit" disabled={imgSaving} style={saveImgBtnStyle}>{imgSaving ? 'Subiendo...' : 'Publicar Imagen'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Internal styles
const tabBtnStyle = (active) => ({
    padding: '12px 20px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: active ? '#f03e3e' : '#f1f3f5',
    color: active ? '#fff' : '#495057',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: active ? '0 4px 10px rgba(0, 0, 0, 0.15)' : 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '0.85rem'
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

const addImgBtnStyle = { 
    background: '#f03e3e',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.95rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(240, 62, 62, 0.2)',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    width: 'auto',
    height: 'auto',
    minWidth: 'max-content'
};

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
