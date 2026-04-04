const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchDishes = async () => {
    const response = await fetch(`${API_URL}/dishes/`);
    if (!response.ok) throw new Error('Error al cargar los platos');
    return await response.json();
};

export const createDish = async (dishData) => {
    const isFormData = dishData instanceof FormData;
    const response = await fetch(`${API_URL}/dishes/`, {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? dishData : JSON.stringify(dishData)
    });
    if (!response.ok) throw new Error('Error al crear el plato');
    return await response.json();
};

export const deleteDish = async (id) => {
    const response = await fetch(`${API_URL}/dishes/${id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el plato');
    return true;
};

// INVENTORY
export const fetchInventory = async () => {
    const response = await fetch(`${API_URL}/inventory/`);
    if (!response.ok) throw new Error('Error al cargar inventario');
    return await response.json();
};

export const createInventoryItem = async (data) => {
    const response = await fetch(`${API_URL}/inventory/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear elemento de inventario');
    return await response.json();
};

export const deleteInventoryItem = async (id) => {
    const response = await fetch(`${API_URL}/inventory/${id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar elemento');
    return true;
};
