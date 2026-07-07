const API_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const api = {
    // Products
    async getProducts() { const res = await fetch(`${API_URL}/products`); return res.json(); },
    async getProduct(id) { const res = await fetch(`${API_URL}/products/${id}`); return res.json(); },
    
    // Auth
    async register(name, email, password) {
        const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
        return res.json();
    },
    async login(email, password) {
        const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('glowmart_wishlist');
        window.location.href = '/login.html';
    },
    isLoggedIn() { return !!localStorage.getItem('token'); },
    getUser() { return JSON.parse(localStorage.getItem('user') || '{}'); },

    // OTP Password
    async forgotPassword(email) {
        const res = await fetch(`${API_URL}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        return res.json();
    },
    async resetPassword(email, otp, newPassword) {
        const res = await fetch(`${API_URL}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, newPassword }) });
        return res.json();
    },

    // User & Wishlist
    async getProfile() {
        const res = await fetch(`${API_URL}/user/profile`, { headers: getAuthHeaders() });
        return res.json();
    },
    async updateProfile(name, address, phone) {
        const res = await fetch(`${API_URL}/user/profile`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ name, address, phone }) });
        return res.json();
    },
    async getWishlist() {
        const res = await fetch(`${API_URL}/user/wishlist`, { headers: getAuthHeaders() });
        return res.json();
    },
    async addToWishlist(productId) {
        const res = await fetch(`${API_URL}/user/wishlist`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ productId }) });
        return res.json();
    },
    async removeFromWishlist(productId) {
        const res = await fetch(`${API_URL}/user/wishlist/${productId}`, { method: 'DELETE', headers: getAuthHeaders() });
        return res.json();
    },

    // Orders
    async placeOrder({ items, total, shipping_address }) {
        const res = await fetch(`${API_URL}/orders`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ items, total, shipping_address }) });
        return res.json();
    },
    
    // Admin
    async getAdminStats() { const res = await fetch(`${API_URL}/admin/stats`, { headers: getAuthHeaders() }); return res.json(); },
    async getAdminUsers() { const res = await fetch(`${API_URL}/admin/users`, { headers: getAuthHeaders() }); return res.json(); },
    async getAdminOrders() { const res = await fetch(`${API_URL}/admin/orders`, { headers: getAuthHeaders() }); return res.json(); },
    async updateOrderStatus(id, status) { const res = await fetch(`${API_URL}/admin/orders/${id}/status`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }) }); return res.json(); },
    async addAdminProduct(data) { const res = await fetch(`${API_URL}/admin/products`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }); return res.json(); }
};
