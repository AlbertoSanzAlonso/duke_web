let base_api_url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Asegurar que termina en /api (sin barra final para que las llamadas concatenen /products/)
if (base_api_url.endsWith('/')) {
  base_api_url = base_api_url.slice(0, -1);
}
if (!base_api_url.endsWith('/api')) {
  base_api_url += '/api';
}
const API_URL = base_api_url;

export const fetchProducts = async () => {
    const response = await fetch(`${API_URL}/products/`);
    if (!response.ok) throw new Error('Error al cargar los productos');
    return await response.json();
};

export const createProduct = async (productData) => {
    const isFormData = productData instanceof FormData;
    const response = await fetch(`${API_URL}/products/`, {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? productData : JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Error al crear el producto');
    return await response.json();
};

export const deleteProduct = async (id) => {
    const response = await fetch(`${API_URL}/products/${id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el producto');
    return true;
};

export const updateProduct = async (id, productData) => {
    const isFormData = productData instanceof FormData;
    const response = await fetch(`${API_URL}/products/${id}/`, {
        method: 'PATCH',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? productData : JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Error al actualizar el producto');
    return await response.json();
};

// CARTA (MENU ENTRIES)
export const fetchMenuEntries = async () => {
    const response = await fetch(`${API_URL}/menu-entries/`);
    if (!response.ok) throw new Error('Error al cargar elementos de la carta');
    return await response.json();
};

export const createMenuEntry = async (data) => {
    const response = await fetch(`${API_URL}/menu-entries/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al añadir producto a la carta');
    return await response.json();
};

export const deleteMenuEntry = async (id) => {
    const response = await fetch(`${API_URL}/menu-entries/${id}/`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al retirarlo de la carta');
    return true;
};

export const updateMenuEntry = async (id, data) => {
    const response = await fetch(`${API_URL}/menu-entries/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al modificar precio de la carta');
    return await response.json();
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

// SALES (TPV)
export const createSale = async (data) => {
    const response = await fetch(`${API_URL}/sales/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al registrar la venta');
    return await response.json();
};

export const fetchSales = async () => {
    const response = await fetch(`${API_URL}/sales/`);
    if (!response.ok) throw new Error('Error al obtener ventas');
    return await response.json();
};

export const updateSale = async (id, data) => {
    const response = await fetch(`${API_URL}/sales/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar venta');
    return await response.json();
};
