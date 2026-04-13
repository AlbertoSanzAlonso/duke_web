import React, { useState, useEffect } from 'react';
import { fetchMe, updateMe } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import { User, Camera, Key, Save } from 'lucide-react';
import './Accounting.css';

const Profile = () => {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchMe();
            setMe(data);
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setEmail(data.email || '');
            setPreviewUrl(data.profile?.avatar);
        } catch (error) {
            setToast({ message: "Error al cargar datos", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password && password !== confirmPassword) {
            setToast({ message: "Las contraseñas no coinciden", type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('first_name', firstName);
            formData.append('last_name', lastName);
            formData.append('email', email);
            if (password) formData.append('password', password);
            if (avatarFile) formData.append('avatar', avatarFile);

            await updateMe(formData);
            setToast({ message: "Perfil actualizado correctamente", type: 'success' });
            setPassword('');
            setConfirmPassword('');
            loadData();
        } catch (error) {
            setToast({ message: error.message || "Error al actualizar", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="admin-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <header style={{ marginBottom: '30px' }}>
                <h2>Mi Perfil</h2>
                <p>Gestiona tu información personal y seguridad</p>
            </header>

            <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ 
                                width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', 
                                background: '#f8f9fa', border: '4px solid #fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}>
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <img src="/brand/duke burger 2 negativo.png" alt="Default Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '15px' }} />
                                )}
                            </div>
                            <label style={{ 
                                position: 'absolute', bottom: '0', right: '0', background: '#f03e3e', color: 'white',
                                padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.2)', border: '2px solid #fff', zIndex: 5
                            }}>
                                <Camera size={20} />
                                <input type="file" onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
                            </label>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>Haz clic en la cámara para subir foto</span>
                    </div>

                    {/* Data Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>Nombre</label>
                            <input 
                                type="text" 
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)} 
                                placeholder="Tu nombre"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Apellido</label>
                            <input 
                                type="text" 
                                value={lastName} 
                                onChange={e => setLastName(e.target.value)} 
                                placeholder="Tu apellido"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="email@ejemplo.com"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ borderTop: '1px solid #eee', pt: '20px', marginTop: '10px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#555' }}>
                            <Key size={18} /> Seguridad (Dejar en blanco si no quieres cambiarla)
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Nueva Contraseña</label>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirmar Contraseña</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSaving}
                        style={{ 
                            background: '#f03e3e', color: 'white', border: 'none', padding: '15px', 
                            borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        {isSaving ? "GUARDANDO..." : <><Save size={20} /> GUARDAR CAMBIOS</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
