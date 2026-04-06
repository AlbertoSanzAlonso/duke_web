let base_api_url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Remove trailing slash
base_api_url = base_api_url.replace(/\/$/, "");
// Add /api if not present
if (!base_api_url.toLowerCase().endsWith('/api')) {
  base_api_url += '/api';
}
const API_URL = base_api_url;

const getHeaders = (contentType = null) => {
    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    const token = localStorage.getItem('duke_admin_token');
    if (token) headers['Authorization'] = `Token ${token}`;
    return headers;
};

const handleResponseError = async (response) => {
    const errorData = await response.json().catch(() => ({}));
    let message = errorData.detail || 'Error en la operación';
    
    if (typeof message === 'object') {
        message = Object.entries(message)
            .map(([field, errors]) => {
                const fieldName = field === 'detail' ? '' : (field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ') + ': ');
                const errorText = Array.isArray(errors) ? errors.join(', ') : errors;
                return `${fieldName}${errorText}`;
            })
            .join(' | ');
    }
    throw new Error(message);
};

// AUTH
export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error('Credenciales inválidas');
    const data = await response.json();
    localStorage.setItem('duke_admin_token', data.token);
    return data;
};

export const logout = () => {
    localStorage.removeItem('duke_admin_token');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('duke_admin_token');
};

// PRODUCTS
export const fetchProducts = async () => {
    const response = await fetch(`${API_URL}/products/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar los productos');
    return await response.json();
};

export const createProduct = async (productData) => {
    const isFormData = productData instanceof FormData;
    const response = await fetch(`${API_URL}/products/`, {
        method: 'POST',
        headers: getHeaders(isFormData ? null : 'application/json'),
        body: isFormData ? productData : JSON.stringify(productData)
    });
    if (!response.ok) return handleResponseError(response);
    return await response.json();
};

export const deleteProduct = async (id) => {
    const response = await fetch(`${API_URL}/products/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar el producto');
    return true;
};

export const updateProduct = async (id, productData) => {
    const isFormData = productData instanceof FormData;
    const response = await fetch(`${API_URL}/products/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(isFormData ? null : 'application/json'),
        body: isFormData ? productData : JSON.stringify(productData)
    });
    if (!response.ok) return handleResponseError(response);
    return await response.json();
};

// CARTA (MENU ENTRIES)
export const fetchMenuEntries = async () => {
    const response = await fetch(`${API_URL}/menu-entries/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar elementos de la carta');
    return await response.json();
};

export const createMenuEntry = async (data) => {
    const response = await fetch(`${API_URL}/menu-entries/`, {
        method: 'POST',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al añadir producto a la carta');
    return await response.json();
};

export const deleteMenuEntry = async (id) => {
    const response = await fetch(`${API_URL}/menu-entries/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al retirarlo de la carta');
    return true;
};

export const updateMenuEntry = async (id, data) => {
    const response = await fetch(`${API_URL}/menu-entries/${id}/`, {
        method: 'PATCH',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al modificar precio de la carta');
    return await response.json();
};

// INVENTORY
export const fetchInventory = async () => {
    const response = await fetch(`${API_URL}/inventory/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar inventario');
    return await response.json();
};

export const createInventoryItem = async (data) => {
    const response = await fetch(`${API_URL}/inventory/`, {
        method: 'POST',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear elemento de inventario');
    return await response.json();
};

export const deleteInventoryItem = async (id) => {
    const response = await fetch(`${API_URL}/inventory/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar elemento');
    return true;
};

// SALES (TPV)
export const createSale = async (data) => {
    const response = await fetch(`${API_URL}/sales/`, {
        method: 'POST',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al registrar la venta');
    return await response.json();
};

export const fetchSales = async () => {
    const response = await fetch(`${API_URL}/sales/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al obtener ventas');
    return await response.json();
};

export const updateSale = async (id, data) => {
    const response = await fetch(`${API_URL}/sales/${id}/`, {
        method: 'PATCH',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar venta');
    return await response.json();
};

export const deleteSale = async (id) => {
    const response = await fetch(`${API_URL}/sales/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar la venta');
    return true;
};

// EXPENSES & ACCOUNTING
export const fetchExpenses = async () => {
    const response = await fetch(`${API_URL}/expenses/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar gastos');
    return await response.json();
};

export const createExpense = async (data) => {
    const response = await fetch(`${API_URL}/expenses/`, {
        method: 'POST',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al registrar gasto');
    return await response.json();
};

export const deleteExpense = async (id) => {
    const response = await fetch(`${API_URL}/expenses/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar gasto');
    return true;
};

export const fetchSupplierOrders = async () => {
    const response = await fetch(`${API_URL}/supplier-orders/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar pedidos de proveedores');
    return await response.json();
};

export const createSupplierOrder = async (data) => {
    const response = await fetch(`${API_URL}/supplier-orders/`, {
        method: 'POST',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al registrar pedido a proveedor');
    return await response.json();
};

export const updateSupplierOrder = async (id, data) => {
    const response = await fetch(`${API_URL}/supplier-orders/${id}/`, {
        method: 'PATCH',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar pedido');
    return await response.json();
};

export const deleteSupplierOrder = async (id) => {
    const response = await fetch(`${API_URL}/supplier-orders/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar pedido');
    return true;
};

export const updateExpense = async (id, data) => {
    const response = await fetch(`${API_URL}/expenses/${id}/`, {
        method: 'PATCH',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar gasto');
    return await response.json();
};

// SETTINGS
export const fetchSettings = async () => {
    const response = await fetch(`${API_URL}/settings/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar configuraciones');
    return await response.json();
};

export const updateSetting = async (key, value) => {
    const response = await fetch(`${API_URL}/settings/${key}/`, {
        method: 'PATCH',
        headers: getHeaders('application/json'),
        body: JSON.stringify({ value })
    });
    if (!response.ok) throw new Error('Error al actualizar configuración');
    return await response.json();
};

export const fetchOpeningHours = async () => {
    const response = await fetch(`${API_URL}/opening-hours/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar horarios');
    return await response.json();
};

export const updateOpeningHour = async (id, data) => {
    const response = await fetch(`${API_URL}/opening-hours/${id}/`, {
        method: 'PATCH',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar horario');
    return await response.json();
};

export const fetchDeliveryRates = async () => {
    const response = await fetch(`${API_URL}/delivery-rates/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar tarifas de envío');
    return await response.json();
};

export const updateDeliveryRates = async (data) => {
    const response = await fetch(`${API_URL}/delivery-rates/1/`, {
        method: 'PATCH',
        headers: getHeaders('application/json'),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar tarifas de envío');
    return await response.json();
};

export const setupDefaultSettings = async () => {
    const response = await fetch(`${API_URL}/settings/setup-defaults/`, {
        method: 'POST',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al inicializar configuraciones');
    return await response.json();
};

// GALLERY
export const fetchGalleryImages = async () => {
    const response = await fetch(`${API_URL}/gallery/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Error al cargar la galería');
    return await response.json();
};

export const createGalleryImage = async (formData) => {
    const response = await fetch(`${API_URL}/gallery/`, {
        method: 'POST',
        headers: getHeaders(null),
        body: formData
    });
    if (!response.ok) return handleResponseError(response);
    return await response.json();
};

export const fetchMe = async () => {
    const response = await fetch(`${API_URL}/me/`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener perfil');
    return await response.json();
};

export const updateMe = async (data) => {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_URL}/me/`, {
        method: 'PATCH',
        headers: getHeaders(isFormData ? null : 'application/json'),
        body: isFormData ? data : JSON.stringify(data)
    });
    if (!response.ok) return handleResponseError(response);
    return await response.json();
};

export const requestPasswordReset = async (email) => {
    try {
        const response = await fetch(`${API_URL}/password-reset/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return await response.json();
    } catch (e) {
        throw new Error("Error al solicitar recuperación");
    }
};

export const resetPasswordConfirm = async (uid, token, newPassword) => {
    try {
        const response = await fetch(`${API_URL}/password-reset-confirm/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, token, new_password: newPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al cambiar contraseña");
        return data;
    } catch (e) {
        throw e;
    }
};

export const deleteGalleryImage = async (id) => {
    const response = await fetch(`${API_URL}/gallery/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al eliminar imagen');
    return true;
};

export const updateGalleryImage = async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_URL}/gallery/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(isFormData ? null : 'application/json'),
        body: isFormData ? data : JSON.stringify(data)
    });
    if (!response.ok) return handleResponseError(response);
    return await response.json();
};
