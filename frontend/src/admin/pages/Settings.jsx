import React, { useState, useEffect } from 'react';
import { 
    fetchGalleryImages, createGalleryImage, deleteGalleryImage, updateGalleryImage,
    fetchSettings, updateSetting, testMail, fetchOpeningHours, fetchDeliveryRates,
    updateOpeningHour, updateDeliveryRates
} from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

import Toast from '../components/Toast';
import { Settings as SettingsIcon, Save, Truck, Clock, Image as ImageIcon, Plus, Trash2, X, AlertTriangle, Users as UsersIcon, History, Mail } from 'lucide-react';
import Gallery from './Gallery';
import Users from './Users';

const Settings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'delivery');
    const [openingHours, setOpeningHours] = useState([]);
    const [deliveryRates, setDeliveryRates] = useState({ base_price: 0, km_price: 0, max_km: 0 });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [mailSettings, setMailSettings] = useState({ 
        imap_server: '', 
        imap_user: '', 
        imap_password: '' 
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
        loadAllData();
    }, [searchParams]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [hoursData, ratesData, settingsData] = await Promise.all([
                fetchOpeningHours(),
                fetchDeliveryRates(),
                fetchSettings()
            ]);
            setOpeningHours(hoursData);
            setDeliveryRates(ratesData);
            
            // Extract mail settings from global settings
            const mailObj = {};
            settingsData.forEach(s => {
                if (['imap_server', 'imap_user', 'imap_password'].includes(s.key)) {
                    mailObj[s.key] = s.value;
                }
            });
            setMailSettings(mailObj);
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

    const saveMailSettings = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                updateSetting('imap_server', mailSettings.imap_server),
                updateSetting('imap_user', mailSettings.imap_user),
                updateSetting('imap_password', mailSettings.imap_password),
            ]);
            setToast({ message: 'Configuración de correo actualizada', type: 'success' });
        } catch (err) {
            setToast({ message: 'Error al guardar configuración de correo', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestMail = async () => {
        if (!mailSettings.imap_server || !mailSettings.imap_user || !mailSettings.imap_password) {
            setToast({ message: 'Completa todos los campos para probar', type: 'error' });
            return;
        }
        setIsTesting(true);
        try {
            const data = await testMail(
                mailSettings.imap_server,
                mailSettings.imap_user,
                mailSettings.imap_password
            );
            setToast({ message: data.message, type: 'success' });
        } catch (err) {
            setToast({ message: err.message, type: 'error' });
        } finally {
            setIsTesting(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={{ width: '100%', padding: '20px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <SettingsIcon size={32} color="#333" />
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Configuración Duke</h2>
            </div>

            <div className="settings-tabs-container" style={{ marginBottom: '30px', width: '100%' }}>
                <div className="settings-tabs">
                    <button onClick={() => handleTabChange('delivery')} className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`} style={{ ...tabBtnStyle(activeTab === 'delivery'), width: '100%' }}>
                        <Truck size={18} /> Tarifas
                    </button>
                    <button onClick={() => handleTabChange('hours')} className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`} style={{ ...tabBtnStyle(activeTab === 'hours'), width: '100%' }}>
                        <Clock size={18} /> Horarios
                    </button>
                    <button onClick={() => handleTabChange('gallery')} className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`} style={{ ...tabBtnStyle(activeTab === 'gallery'), width: '100%' }}>
                        <ImageIcon size={18} /> Galería
                    </button>
                    <button onClick={() => handleTabChange('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} style={{ ...tabBtnStyle(activeTab === 'users'), width: '100%' }}>
                        <UsersIcon size={18} /> Personal
                    </button>
                    <button onClick={() => handleTabChange('custom')} className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} style={{ ...tabBtnStyle(activeTab === 'custom'), width: '100%' }}>
                        <Save size={18} /> Otros
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '20px' }}>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px' }}>
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

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: 'auto' }}>
                                            <input 
                                                type="time" 
                                                value={hour.opening_time} 
                                                disabled={!hour.is_open}
                                                onChange={e => handleHourChange(hour.id, 'opening_time', e.target.value)}
                                                style={{ ...timeInputStyle, opacity: hour.is_open ? 1 : 0.5, border: '1px solid #ddd', fontSize: '1rem', padding: '8px', width: '100px' }}
                                            />
                                            <span style={{ color: '#888' }}>a</span>
                                            <input 
                                                type="time" 
                                                value={hour.closing_time} 
                                                disabled={!hour.is_open}
                                                onChange={e => handleHourChange(hour.id, 'closing_time', e.target.value)}
                                                style={{ ...timeInputStyle, opacity: hour.is_open ? 1 : 0.5, border: '1px solid #ddd', fontSize: '1rem', padding: '8px', width: '100px' }}
                                            />
                                        </div>

                                        <button 
                                            onClick={() => handleHourChange(hour.id, 'is_open', !hour.is_open)}
                                            style={{
                                                padding: '8px 15px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                background: hour.is_open ? '#ebfbee' : '#f1f3f5',
                                                color: hour.is_open ? '#2b8a3e' : '#888',
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

                {activeTab === 'custom' && (
                    <div className="tab-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <Save size={32} color="#f03e3e" />
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Personalización</h2>
                        </div>
                        <div className="setting-field">
                            <label style={labelStyle}>Texto del Banner (Marquee)</label>
                            <textarea 
                                value={deliveryRates.marquee_text || ''} 
                                onChange={e => handleRateChange('marquee_text', e.target.value)} 
                                style={{ ...inputStyle(false), height: '100px', resize: 'vertical' }}
                                placeholder="Ej: BURGER - PACHATA - LOMO - PIZZA - BEBIDA - SAN JUAN"
                            />
                        </div>
                        <button onClick={saveRates} style={saveButtonStyle} disabled={isSaving}>
                            <Save size={20} /> {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                        </button>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="tab-content" style={{ padding: '0' }}>
                        <Gallery />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="tab-content" style={{ padding: '0' }}>
                        <Users />
                    </div>
                )}


            </div>
        </div>
    );
};

// Internal styles
const tabBtnStyle = (active) => ({
    padding: '12px 10px',
    backgroundColor: active ? 'var(--admin-primary)' : '#fff',
    color: active ? '#fff' : '#495057',
    border: '1px solid',
    borderColor: active ? 'var(--admin-primary)' : '#ddd',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 4px 12px rgba(240, 62, 62, 0.2)' : 'none',
    fontWeight: '700',
    fontFamily: 'inherit',
    textTransform: 'uppercase',
    letterSpacing: '0.1px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    width: '100%',
    justifyContent: 'center'
});

const labelStyle = { fontWeight: 'bold', fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', marginBottom: '8px', display: 'block' };

const inputStyle = (isKm) => ({
    width: '100%',
    boxSizing: 'border-box',
    background: '#fff',
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
    width: 'max-content',
    minWidth: '200px',
    margin: '30px auto 0 auto',
    padding: '12px 40px',
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
