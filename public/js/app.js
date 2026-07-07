// Cart Management
const cart = {
    items: JSON.parse(localStorage.getItem('cart')) || [],
    
    add(product) {
        const existing = this.items.find(i => i.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.save();
        this.updateUI();
    },
    
    remove(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.save();
        this.updateUI();
    },
    
    clear() {
        this.items = [];
        this.save();
        this.updateUI();
    },
    
    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    },

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    updateUI() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = count;
        }
    }
};

// UI Initialization
document.addEventListener('DOMContentLoaded', () => {
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html') || window.location.pathname.includes('register.html') || window.location.pathname.includes('forgot-password.html') || window.location.pathname.includes('reset-password.html');
    if (!api.isLoggedIn() && !isAuthPage) {
        window.location.href = 'login.html';
        return;
    }
    
    if (api.isLoggedIn() && isAuthPage) {
        window.location.href = 'index.html';
        return;
    }

    cart.updateUI();
    updateAuthUI();
});

function updateAuthUI() {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;

    if (api.isLoggedIn()) {
        const user = api.getUser();
        let links = `
            <a href="profile.html" title="Profile">👤 Profile</a>
            <a href="wishlist.html" title="Wishlist">🤍 Wishlist</a>
        `;
        if (user.role === 'admin') {
            links += `<a href="/admin/index.html" class="admin-link" style="color: #ff3e6c; font-weight: bold;">Admin Panel</a>`;
        }
        
        authLinks.innerHTML = `
            ${links}
            <a href="#" onclick="api.logout()">Logout</a>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="login.html" title="Login / Register">👤 Login / Register</a>
        `;
    }
}
