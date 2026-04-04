const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchDishes = async () => {
    const response = await fetch(`${API_URL}/dishes/`);
    if (!response.ok) throw new Error('Error al cargar los platos');
    return await response.json();
};

export const createDish = async (dishData) => {
    const response = await fetch(`${API_URL}/dishes/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dishData)
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
