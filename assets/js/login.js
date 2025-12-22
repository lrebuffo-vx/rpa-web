// DOM Elements
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

// LOGIN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Login exitoso, redirigir al Dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        showError(loginError, error.message || 'Error al iniciar sesión');
    }
});

// SESSION CHECK
async function checkSession() {
    if (!window.supabaseClient) return; // Esperar a que config.js cargue

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (session) {
        // Si ya hay sesión, ir directo al dashboard
        window.location.href = 'dashboard.html';
    }
}

function showError(element, msg) {
    element.textContent = msg;
    setTimeout(() => { element.textContent = ''; }, 3000);
}
