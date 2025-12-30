// DOM Elements variable declarations (initialized inside DOMContentLoaded)
let loginSection;
let loginForm;
let loginError;
let googleLoginBtn;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    loginSection = document.getElementById('login-section');
    loginForm = document.getElementById('login-form');
    loginError = document.getElementById('login-error');
    googleLoginBtn = document.getElementById('google-login-btn');

    // Run session check
    checkSession();

    // Attach Event Listeners
    attachEventListeners();
});

function attachEventListeners() {
    // GOOGLE LOGIN
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            console.log('Google login button clicked');

            if (!window.supabaseClient) {
                console.error('Supabase Client not initialized');
                showError(loginError, 'Error de configuración: Supabase no disponible');
                return;
            }

            try {
                console.log('Attempting OAuth sign in...');
                const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                        // Ensure full URL is passed
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
        console.error('Google login button NOT found in DOM during initialization');
    }

    // LOGIN FORM
    if (loginForm) {
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
    }
}

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
