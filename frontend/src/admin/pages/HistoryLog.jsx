import React, { useState, useEffect } from 'react';
import { Search, History, User, Clock, Info, Shield, ShoppingCart, BookOpen, Package, Settings, Camera, Trash2, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchActionLogs } from '../../services/api';
import './Accounting.css';
import LoadingScreen from '../components/LoadingScreen';

const HistoryLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedModule, selectedDate]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchActionLogs();
            setLogs(data);
        } catch (error) {
            console.error("Error loading logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getModuleIcon = (module) => {
        switch (module) {
            case 'TPV': return <ShoppingCart size={14} />;
            case 'CONTABILIDAD': return <BookOpen size={14} />;
            case 'PRODUCTOS': return <Package size={14} />;
            case 'CARTA': return <BookOpen size={14} />;
            case 'INVENTARIO': return <Package size={14} />;
            case 'USUARIOS': return <User size={14} />;
            case 'AJUSTES': return <Settings size={14} />;
            case 'GALERIA': return <Camera size={14} />;
            default: return <Info size={14} />;
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
        const term = searchTerm.toLowerCase();
        
        // Date match (ignoring time)
        let matchesDate = true;
        if (selectedDate) {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            matchesDate = logDate === selectedDate;
        }

        const matchesSearch = 
            log.description.toLowerCase().includes(term) || 
            log.username.toLowerCase().includes(term) || 
            log.action_type.toLowerCase().includes(term) ||
            log.module.toLowerCase().includes(term);
        return matchesModule && matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) return <LoadingScreen />;

    return (
        <div className="accounting-container" style={{ padding: '20px' }}>
            <div className="accounting-header">
                <div className="header-title">
                    <History size={28} style={{ color: 'var(--admin-primary)' }} />
                    <div>
                        <h1>Historial de Acciones</h1>
                        <p>Registro detallado de actividad y auditoría de usuarios</p>
                    </div>
                </div>
            </div>

            <div className="accounting-filters" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: '15px' }}>
                <div className="search-box" style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={18} color="#888" />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario, detalle o acción..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ height: '48px', border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                    />
                </div>

                <div className="filter-box" style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '0 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={16} color="#666" />
                    <select 
                        value={selectedModule} 
                        onChange={(e) => setSelectedModule(e.target.value)}
                        style={{ border: 'none', padding: '0 5px', background: 'transparent', height: '48px', outline: 'none', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', color: '#333' }}
                    >
                        <option value="ALL">TODOS</option>
                        <option value="TPV">TPV</option>
                        <option value="CONTABILIDAD">CONTABILIDAD</option>
                        <option value="PRODUCTOS">PRODUCTOS</option>
                        <option value="INVENTARIO">INVENTARIO</option>
                        <option value="USUARIOS">USUARIOS</option>
                        <option value="GALERIA">GALERÍA</option>
                    </select>
                </div>

                <div className="filter-box" style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '0 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#666" />
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ border: 'none', padding: '10px 5px', background: 'transparent', height: '48px', outline: 'none', fontWeight: 'bold' }}
                    />
                    {selectedDate && (
                        <button onClick={() => setSelectedDate('')} style={{ border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    )}
                </div>
                
                <button 
                    onClick={loadLogs} 
                    title="Recargar historial"
                    style={{ 
                        height: '48px', 
                        width: '48px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: '#343a40', 
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#000'}
                    onMouseOut={e => e.currentTarget.style.background = '#343a40'}
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="table-container" style={{ marginTop: '25px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table className="accounting-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.75rem', color: '#666', borderBottom: '1px solid #eee' }}>FECHA Y HORA</th>
                            <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.75rem', color: '#666', borderBottom: '1px solid #eee' }}>USUARIO</th>
                            <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.75rem', color: '#666', borderBottom: '1px solid #eee' }}>MODULO</th>
                            <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.75rem', color: '#666', borderBottom: '1px solid #eee' }}>ACCIÓN</th>
                            <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.75rem', color: '#666', borderBottom: '1px solid #eee' }}>DETALLE DEL MOVIMIENTO</th>
                        </tr>
                    </thead>
                    <tbody style={{ background: '#fff' }}>
                        {currentLogs.length > 0 ? currentLogs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.85rem' }}>
                                        <Clock size={14} />
                                        {new Date(log.timestamp).toLocaleString('es-AR', {
                                            day: '2-digit', month: '2-digit', year: '2-digit',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#333' }}>
                                        <div style={{ width: '28px', height: '28px', background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                            <User size={14} />
                                        </div>
                                        {log.username}
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{ 
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '4px 10px', borderRadius: '20px', background: '#f5f7f9',
                                        fontSize: '0.7rem', fontWeight: '800', color: '#546e7a',
                                        textTransform: 'uppercase'
                                    }}>
                                        {getModuleIcon(log.module)}
                                        {log.module}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{ 
                                        display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
                                        fontSize: '0.7rem', fontWeight: '900',
                                        background: log.action_type === 'DELETE' ? '#fff5f5' : (log.action_type === 'CREATE' ? '#f5fff5' : '#f5faff'),
                                        color: log.action_type === 'DELETE' ? '#fa5252' : (log.action_type === 'CREATE' ? '#40c057' : '#228be6'),
                                    }}>
                                        {log.action_type}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ color: '#222', fontSize: '0.9rem', fontWeight: '500' }}>
                                        {log.description}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '80px 0' }}>
                                    <div style={{ color: '#999', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                        <AlertCircle size={48} opacity={0.2} />
                                        <p style={{ fontSize: '1.1rem' }}>No se encontraron registros de este tipo.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '25px', padding: '10px' }}>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{ 
                            padding: '8px 16px', background: '#343a40', color: 'white', 
                            border: 'none', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 'bold'
                        }}
                    >
                        ANTERIOR
                    </button>
                    
                    <span style={{ fontWeight: 'bold', color: '#666' }}>
                        PÁGINA {currentPage} DE {totalPages}
                    </span>

                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{ 
                            padding: '8px 16px', background: '#343a40', color: 'white', 
                            border: 'none', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 'bold'
                        }}
                    >
                        SIGUIENTE
                    </button>
                </div>
            )}
        </div>
    );
};

export default HistoryLog;
