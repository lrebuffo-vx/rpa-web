// DOM Elements
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

const googleLoginBtn = document.getElementById('google-login-btn');

// GOOGLE LOGIN
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        console.log('Google login button clicked');
        console.log('Supabase Client:', window.supabaseClient);

        try {
            console.log('Attempting OAuth sign in...');
            const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin + '/dashboard.html'
                }
            });

            if (error) {
                console.error('Supabase OAuth Error:', error);
                throw error;
            }

            console.log('OAuth initiated, data:', data);

        } catch (error) {
            console.error('Catch Error:', error);
            showError(loginError, error.message || 'Error al iniciar con Google');
        }
    });
} else {
    console.error('Google login button NOT found in DOM');
}

// LOGIN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    // DOMAIN VALIDATION
    if (!email.endsWith('@vortex-it.com')) {
        showError(loginError, 'Solo se permiten correos de @vortex-it.com');
        return;
    }

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
