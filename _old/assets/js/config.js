const SUPABASE_URL = 'https://urxeexrhcxmqngjpifnv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeGVleHJoY3htcW5nanBpZm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzYzODEsImV4cCI6MjA4MTYxMjM4MX0.4YWmH74wCSE7jKtgIsB5-5xsdK1zBTe9riiaY0SeB0Q';

// Creamos la instancia y la asignamos a una variable global explícita
// Usamos 'supabaseClient' para evitar conflictos con la variable 'supabase' del CDN
window.supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!window.supabaseClient) {
    console.error('Supabase no se pudo inicializar. Verifica los scripts en el HTML.');
}
