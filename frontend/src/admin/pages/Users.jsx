import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../services/api'; 
import { UserPlus, Search, Edit2, Trash2, Shield, Mail, Key, User as UserIcon } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Toast from '../components/Toast';
import './Accounting.css'; // Reuse table and layout styles

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [toast, setToast] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        profile: {
            can_use_tpv: false,
            can_use_accounting: false,
            can_use_menu: false,
            can_use_inventory: false,
            can_use_promos: false,
            can_use_gallery: false,
            can_use_settings: false,
            can_use_kitchen: false,
            can_use_webmail: false,
            is_admin_manager: false
        }
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
            setToast({ message: "No tienes permiso para ver usuarios", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email || '',
                password: '', 
                confirmPassword: '',
                profile: user.profile || {
                    can_use_tpv: false,
                    can_use_accounting: false,
                    can_use_menu: false,
                    can_use_inventory: false,
                    can_use_promos: false,
                    can_use_gallery: false,
                    can_use_settings: false,
                    can_use_kitchen: false,
                    can_use_webmail: false,
                    is_admin_manager: false
                }
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                email: '',
                profile: {
                    can_use_tpv: false,
                    can_use_accounting: false,
                    can_use_menu: false,
                    can_use_inventory: false,
                    can_use_promos: false,
                    can_use_gallery: false,
                    can_use_settings: false,
                    can_use_kitchen: false,
                    can_use_webmail: false,
                    is_admin_manager: false
                }
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handlePermissionChange = (perm) => {
        setFormData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                [perm]: !prev.profile[perm]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const pwd = (formData.password || '').trim();
        const cpwd = (formData.confirmPassword || '').trim();
        
        const isChangingPassword = pwd.length > 0 || cpwd.length > 0;
        
        if (isChangingPassword && pwd !== cpwd) {
            setToast({ message: "Las contraseñas no coinciden", type: 'error' });
            return;
        }

        try {
            if (editingUser) {
                // Ensure only necessary fields are sent to PATCH
                const dataToUpdate = {
                    username: formData.username,
                    email: formData.email,
                    profile: formData.profile
                };
                
                if (pwd.length > 0) {
                    dataToUpdate.password = pwd;
                }
                
                await updateUser(editingUser.id, dataToUpdate);
                setToast({ message: "Usuario actualizado", type: 'success' });
            } else {
                if (pwd.length === 0) {
                    setToast({ message: "La contraseña es obligatoria", type: 'error' });
                    return;
                }
                const dataToCreate = {
                    username: formData.username,
                    email: formData.email,
                    password: pwd,
                    profile: formData.profile
                };
                await createUser(dataToCreate);
                setToast({ message: "Usuario creado", type: 'success' });
            }
            handleCloseModal();
            loadUsers();
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;
        try {
            const { deleteUser } = await import('../../services/api');
            await deleteUser(id);
            setToast({ message: "Usuario eliminado", type: 'success' });
            loadUsers();
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && users.length === 0) return <LoadingScreen />;

    return (
        <div className="admin-content users-page-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <header className="page-header users-header-flex">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                        <Shield size={32} color="#f03e3e" /> Gestión de Usuarios
                    </h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>Administra el personal y sus permisos de acceso.</p>
                </div>
                <button 
                    className="new-user-btn" 
                    onClick={() => handleOpenModal()} 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        background: '#e31837',
                        color: 'white',
                        border: '2px solid #e31837',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                >
                    <UserPlus size={20} /> NUEVO USUARIO
                </button>
            </header>

            <div className="admin-card">
                <div className="search-bar" style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '20px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '15px 15px 15px 55px', borderRadius: '12px', border: '1px solid #ddd', width: '100%', fontSize: '1rem', background: '#fff' }}
                    />
                </div>

                <div className="accounting-table-container">
                    <table className="accounting-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Permisos Activos</th>
                                <th className="txt-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td data-label="Usuario">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '8px', background: '#f1f3f5', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <UserIcon size={16} color="#495057" />
                                            </div>
                                            <strong>{user.username}</strong>
                                        </div>
                                    </td>
                                    <td data-label="Email" style={{ color: '#666' }}>{user.email || 'N/A'}</td>
                                    <td data-label="Permisos">
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {user.is_superuser ? <span className="badge-perm primary">SuperUser</span> : (
                                                <>
                                                    {user.profile?.can_use_tpv && <span className="badge-perm">TPV</span>}
                                                    {user.profile?.can_use_accounting && <span className="badge-perm">Conta</span>}
                                                    {user.profile?.can_use_menu && <span className="badge-perm">Menu</span>}
                                                    {user.profile?.can_use_inventory && <span className="badge-perm">Almacen</span>}
                                                    {user.profile?.can_use_kitchen && <span className="badge-perm" style={{ background: '#ffa94d', color: '#fff' }}>Cocina</span>}
                                                    {user.profile?.can_use_webmail && <span className="badge-perm">Webmail</span>}
                                                    {user.profile?.is_admin_manager && <span className="badge-perm success">Admin</span>}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td data-label="Acciones" className="txt-right">
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="icon-btn edit" onClick={() => handleOpenModal(user)}><Edit2 size={18} /></button>
                                            {!user.is_superuser && (
                                                <button className="icon-btn delete" onClick={() => handleDelete(user.id)}><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Vista Móvil Simplificada */}
                <div className="users-mobile-list">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="user-mobile-card" onClick={() => handleOpenModal(user)}>
                            <div className="user-mobile-info">
                                <div className="user-mobile-avatar">
                                    <UserIcon size={20} />
                                </div>
                                <div className="user-mobile-details">
                                    <strong className="user-mobile-name">{user.username}</strong>
                                    {user.is_superuser && <span style={{ fontSize: '0.7rem', color: '#339af0', fontWeight: 'bold' }}>SUPERUSUARIO</span>}
                                </div>
                            </div>
                            <div style={{ color: '#888', flexShrink: 0 }}>
                                <Edit2 size={18} />
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                            No se encontraron usuarios.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="modal-overlay users-modal-overlay">
                    <div className="modal-content" style={{ 
                        maxWidth: '600px', 
                        width: '95%', 
                        background: '#fff', 
                        color: '#333', 
                        padding: '20px', 
                        borderRadius: '16px', 
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
                        position: 'relative',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ margin: '0', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#444', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}><UserIcon size={14} style={{ marginRight: '5px' }} /> NOMBRE DE USUARIO</label>
                                    <input 
                                        type="text" 
                                        value={formData.username} 
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        required
                                        placeholder="ej: juanperez"
                                        style={{ padding: '16px', borderRadius: '12px', border: '2px solid #f1f3f5', fontSize: '1rem', background: '#fcfcfc', color: '#111', transition: 'all 0.2s' }}
                                        className="styled-modal-input"
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#444', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}><Mail size={14} style={{ marginRight: '5px' }} /> EMAIL</label>
                                    <input 
                                        type="email" 
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="ej: juan@gmail.com"
                                        style={{ padding: '16px', borderRadius: '12px', border: '2px solid #f1f3f5', fontSize: '1rem', background: '#fcfcfc', color: '#111', transition: 'all 0.2s' }}
                                        className="styled-modal-input"
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#444', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}><Key size={14} style={{ marginRight: '5px' }} /> {editingUser ? 'NUEVA CONTRASEÑA' : 'CONTRASEÑA'}</label>
                                    <input 
                                        type="password" 
                                        value={formData.password} 
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        required={!editingUser}
                                        placeholder="********"
                                        style={{ padding: '16px', borderRadius: '12px', border: '2px solid #f1f3f5', fontSize: '1rem', background: '#fcfcfc', color: '#111', transition: 'all 0.2s' }}
                                        className="styled-modal-input"
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#444', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}><Key size={14} style={{ marginRight: '5px' }} /> REPETIR CONTRASEÑA</label>
                                    <input 
                                        type="password" 
                                        value={formData.confirmPassword} 
                                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                        required={!editingUser}
                                        placeholder="********"
                                        style={{ padding: '16px', borderRadius: '12px', border: '2px solid #f1f3f5', fontSize: '1rem', background: '#fcfcfc', color: '#111', transition: 'all 0.2s' }}
                                        className="styled-modal-input"
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '25px' }}>
                                <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#222' }}>
                                    <Shield size={16} /> Permisos de Acceso
                                </h4>
                                <div className="permissions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '10px' }}>
                                    <PermissionToggle 
                                        label="Uso de TPV" 
                                        active={formData.profile.can_use_tpv} 
                                        onChange={() => handlePermissionChange('can_use_tpv')} 
                                    />
                                    <PermissionToggle 
                                        label="Contabilidad" 
                                        active={formData.profile.can_use_accounting} 
                                        onChange={() => handlePermissionChange('can_use_accounting')} 
                                    />
                                    <PermissionToggle 
                                        label="Gestión de Carta" 
                                        active={formData.profile.can_use_menu} 
                                        onChange={() => handlePermissionChange('can_use_menu')} 
                                    />
                                    <PermissionToggle 
                                        label="Gestión Inventario" 
                                        active={formData.profile.can_use_inventory} 
                                        onChange={() => handlePermissionChange('can_use_inventory')} 
                                    />
                                    <PermissionToggle 
                                        label="Galería y Fotos" 
                                        active={formData.profile.can_use_gallery} 
                                        onChange={() => handlePermissionChange('can_use_gallery')} 
                                    />
                                    <PermissionToggle 
                                        label="Administrar Usuarios" 
                                        active={formData.profile.is_admin_manager} 
                                        onChange={() => handlePermissionChange('is_admin_manager')} 
                                    />
                                    <PermissionToggle 
                                        label="Acceso a COCINA" 
                                        active={formData.profile.can_use_kitchen} 
                                        onChange={() => handlePermissionChange('can_use_kitchen')} 
                                    />
                                    <PermissionToggle 
                                        label="Acceso a WEBMAIL" 
                                        active={formData.profile.can_use_webmail} 
                                        onChange={() => handlePermissionChange('can_use_webmail')} 
                                    />
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn-secondary" onClick={handleCloseModal} style={{ flex: 1, padding: '15px', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer', fontWeight: 'bold' }}>CANCELAR</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '15px', borderRadius: '8px', border: 'none', background: 'var(--admin-primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>{editingUser ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .new-user-btn:hover {
                    background: white !important;
                    color: black !important;
                    border-color: black !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .badge-perm {
                    font-size: 0.7rem;
                    background: #e9ecef;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: bold;
                    color: #495057;
                }
                .badge-perm.primary { background: #339af0; color: white; }
                .badge-perm.success { background: #51cf66; color: white; }
                
                .perm-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f8f9fa;
                    padding: 10px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .perm-toggle:hover { background: #f1f3f5; }
                .perm-toggle.active { background: #fff5f5; border: 1px solid #ffc9c9; }
                
                .perm-toggle span {
                    font-weight: 600;
                    color: #888; /* Grey when inactive */
                    transition: color 0.3s;
                }
                .perm-toggle.active span {
                    color: #222; /* Black when active */
                }

                .styled-modal-input:focus {
                    border-color: var(--admin-primary) !important;
                    background: #fff !important;
                    box-shadow: 0 0 0 4px rgba(227, 24, 55, 0.1);
                    outline: none;
                }
                
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 34px;
                    height: 18px;
                }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 18px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 14px; width: 14px;
                    left: 2px; bottom: 2px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider { background-color: #e31837; }
                input:checked + .slider:before { transform: translateX(16px); }
                .users-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(5px);
                    z-index: 9999;
                    padding: 15px; /* Margin for the modal itself */
                }

                .users-header-flex {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }

                @media (max-width: 768px) {
                    .users-header-flex {
                        flex-direction: column;
                        align-items: flex-start;
                        margin-bottom: 20px !important;
                        padding: 0 5px;
                    }
                    .users-page-content {
                        padding: 10px !important;
                    }
                    .new-user-btn {
                        margin-top: 15px !important;
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

const PermissionToggle = ({ label, active, onChange }) => (
    <div className={`perm-toggle ${active ? 'active' : ''}`} onClick={onChange}>
        <span style={{ fontSize: '0.85rem' }}>{label}</span>
        <label className="switch">
            <input type="checkbox" checked={active} readOnly />
            <span className="slider"></span>
        </label>
    </div>
);

export default Users;
