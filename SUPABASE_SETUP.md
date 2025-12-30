# Configuración de Google OAuth para Supabase

Para que el inicio de sesión con Google funcione, debes configurar el proveedor en Google Cloud Platform (GCP) y en tu proyecto de Supabase.

## Paso 1: Obtener Credenciales de Google Cloud

1. Ve a la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Crea un nuevo proyecto o selecciona uno existente.
3. Busca **"APIs & Services"** > **"OAuth consent screen"**.
   - Selecciona **External** y crea.
   - Llena los datos obligatorios (Nombre de la App, correos de soporte).
4. Ve a **"Credentials"** > **"Create Credentials"** > **"OAuth client ID"**.
   - Tipo de Aplicación: **Web application**.
   - Nombre: "Supabase Login" (o lo que prefieras).
   - **Authorized redirect URIs**: Aquí pegarás la URL de Supabase. (Ver Paso 2).
5. Dale a **Create**. Copia el **Client ID** y el **Client Secret**.

## Paso 2: Configurar Supabase

1. Ve a tu [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra a tu proyecto > **Authentication** > **Providers**.
3. Selecciona **Google** y habilítalo.
4. Pega el **Client ID** y **Client Secret** que obtuviste en el paso anterior.
5. Copia la **Callback URL (for OAuth)** (se ve como `https://<tu-proyecto>.supabase.co/auth/v1/callback`).
6. **Vuelve a la consola de Google Cloud** y pega esa URL en **"Authorized redirect URIs"** del paso 1.4.
7. En Supabase, guarda los cambios.

## Paso 3: Configurar Redirecciones de URL (Supabase)

1. En Supabase Dashboard, ve a **Authentication** > **URL Configuration**.
2. En **Site URL**, pon la URL base de tu sitio (ej: `http://localhost:5500` o tu dominio de producción).
3. En **Redirect URLs**, añade cualquier ruta adicional si es necesaria (ej: `http://localhost:5500/dashboard.html`).
   - *Nota: Esto permite que Supabase redirija al usuario a tu dashboard después del login.*

¡Listo! Ahora el botón de "Iniciar con Google" debería funcionar.
