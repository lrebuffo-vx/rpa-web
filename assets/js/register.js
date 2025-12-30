const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirmPassword = document.getElementById('reg-confirm-password').value.trim();

    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden.');
        return;
    }

    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    // DOMAIN VALIDATION
    if (!email.endsWith('@vortex-it.com')) {
        showError('Solo se permite el registro con correos @vortex-it.com');
        return;
    }

    try {
        // Registrar Usuario
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        // Si el registro es exitoso, Supabase puede loguear automáticamente o pedir confirmación de email
        // Dependiendo de la config de Supabase. Asumimos login automático o redirección.

        if (data.user) {
            alert('Cuenta creada exitosamente. Redirigiendo...');
            window.location.href = 'index.html';
        }

    } catch (error) {
        showError(error.message || 'Error al registrarse');
    }
});

function showError(msg) {
    registerError.textContent = msg;
    setTimeout(() => { registerError.textContent = ''; }, 3000);
}
