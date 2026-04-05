import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSetting } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { Settings as SettingsIcon, Save, Truck, DollarSign } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await fetchSettings();
            setSettings(data);
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key, value) => {
        setIsSaving(true);
        try {
            await updateSetting(key, value);
            setToast({ message: 'Configuración actualizada correctamente', type: 'success' });
            loadSettings();
        } catch (error) {
            setToast({ message: 'Error al actualizar configuración', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <SettingsIcon size={32} color="#333" />
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Configuración General</h2>
            </div>

            <div className="admin-card" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
                    <Truck size={24} color="#f03e3e" />
                    <h3 style={{ margin: 0 }}>Tarifas de Envío (Cadetería)</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {settings.filter(s => s.key.startsWith('delivery_')).map(setting => (
                        <div key={setting.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem', color: '#666' }}>
                                {setting.description || setting.key}
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>$</span>
                                    <input 
                                        type="number" 
                                        value={setting.value}
                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                        style={{ width: '100%', padding: '12px 12px 12px 30px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <button 
                                    onClick={() => handleUpdate(setting.key, setting.value)}
                                    disabled={isSaving}
                                    style={{ 
                                        padding: '0 25px', 
                                        background: '#333', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    <Save size={18} /> {isSaving ? '...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div style={{ marginTop: '30px', padding: '15px', background: '#fff9e6', borderRadius: '8px', borderLeft: '4px solid #fcc419', fontSize: '0.9rem' }}>
                    <strong>Nota:</strong> Estos valores recalcularán automáticamente el costo de envío en el carrito del cliente basado en la distancia por GPS.
                </div>
            </div>
        </div>
    );
};

export default Settings;
