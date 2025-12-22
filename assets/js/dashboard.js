// State Management
const STATE = {
    currentUser: null,
    news: []
};

// DOM Elements
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');
const newsFeed = document.getElementById('news-feed');
const adminControls = document.getElementById('admin-controls');
const createNewsBtn = document.getElementById('create-news-btn');
const newsModal = document.getElementById('news-modal');
const newsForm = document.getElementById('news-form');
const modalTitle = document.getElementById('modal-title');
const closeModalSpans = document.querySelectorAll('.close-modal, .close-modal-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

// SESSION CHECK
async function checkSession() {
    // Verificar si window.supabaseClient está definido (config.js cargado)
    if (!window.supabaseClient) {
        console.error('Supabase Client no disponible.');
        window.location.href = 'index.html';
        return;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        // Si no hay sesión, volver al login
        window.location.href = 'index.html';
        return;
    }

    await fetchUserProfile(session.user);
    fetchNews();
}

async function fetchUserProfile(authUser) {
    if (!authUser) return;

    let role = 'user';
    // Lógica simple de roles (puedes mejorar esto consultando tu tabla)

    // Consulta de rol real en la base de datos (si existe la tabla users y el usuario tiene rol asignado)
    try {
        const { data } = await window.supabaseClient
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();

        if (data && data.role) {
            role = data.role;
        }
    } catch (e) {
        // Si falla (ej. usuario no esta en tabla publica aun), se mantiene como 'user'
    }

    STATE.currentUser = {
        id: authUser.id,
        email: authUser.email,
        username: authUser.email.split('@')[0],
        role: role
    };

    updateDashboardUI();
}

function updateDashboardUI() {
    if (!STATE.currentUser) return;

    welcomeMsg.textContent = `Hola, ${STATE.currentUser.username} (${STATE.currentUser.role})`;

    if (STATE.currentUser.role === 'admin') {
        if (adminControls) adminControls.classList.remove('hidden');
    } else {
        if (adminControls) adminControls.classList.add('hidden');
    }
}

// LOGOUT
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}


// --- DATA ACCESS (SUPABASE) ---

async function fetchNews() {
    try {
        const { data, error } = await window.supabaseClient
            .from('news')
            .select('*')
            .order('published_at', { ascending: false });

        if (error) throw error;

        STATE.news = data || [];
        renderNews();
    } catch (error) {
        console.error('Error fetching news:', error.message);
        if (newsFeed) newsFeed.innerHTML = '<p>Error cargando noticias.</p>';
    }
}

async function uploadImage(file) {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
        const { error: uploadError } = await window.supabaseClient.storage
            .from('image_news')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = window.supabaseClient.storage
            .from('image_news')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error subiendo imagen: ' + error.message);
        return null;
    }
}

async function createNews(title, content, imageFile) {
    try {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
            if (!imageUrl) return; // Stop if upload failed
        }

        const { error } = await window.supabaseClient
            .from('news')
            .insert([
                {
                    title,
                    content,
                    image_url: imageUrl,
                    author_id: STATE.currentUser.id
                }
            ]);

        if (error) throw error;
        fetchNews();

    } catch (error) {
        console.error('Error creating news:', error.message);
        alert('Error al crear noticia: ' + error.message);
    }
}

async function updateNews(id, title, content, image) {
    try {
        let imageUrl = image;

        // Si 'image' es un objeto File (nuevo archivo seleccionado), lo subimos
        if (image instanceof File) {
            imageUrl = await uploadImage(image);
            if (!imageUrl) return;
        }

        const { error } = await window.supabaseClient
            .from('news')
            .update({ title, content, image_url: imageUrl })
            .eq('news_id', id);

        if (error) throw error;
        fetchNews();

    } catch (error) {
        console.error('Error updating news:', error.message);
        alert('Error al actualizar: ' + error.message);
    }
}

window.deleteNews = async function (id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
        try {
            const { error } = await window.supabaseClient
                .from('news')
                .delete()
                .eq('news_id', id);

            if (error) throw error;
            fetchNews();

        } catch (error) {
            console.error('Error deleting:', error.message);
            alert('Error al borrar: ' + error.message);
        }
    }
};

// --- Render Helpers ---

function renderNews() {
    if (!newsFeed) return;
    newsFeed.innerHTML = '';

    STATE.news.forEach(news => {
        const card = document.createElement('div');
        card.className = 'news-card fade-in';

        const imageUrl = news.image_url;
        const newsTitle = news.title;
        const newsContent = news.content;
        const newsId = news.news_id;
        const newsDate = news.published_at || news.created_at;

        const imageHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${newsTitle}" class="news-image">`
            : `<div class="news-image" style="background: linear-gradient(45deg, #1e293b, #334155); display:flex; align-items:center; justify-content:center; color:#64748b;"><span>Sin Imagen</span></div>`;

        let adminActions = '';
        if (STATE.currentUser && STATE.currentUser.role === 'admin') {
            adminActions = `
                <div class="news-actions">
                    <button class="btn-secondary" onclick="openEditModal(${newsId})">Editar</button>
                    <button class="btn-danger" onclick="deleteNews(${newsId})">Eliminar</button>
                </div>
            `;
        }

        const dateStr = new Date(newsDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

        card.innerHTML = `
            ${imageHtml}
            <div class="news-content">
                <span class="news-date">${dateStr}</span>
                <h3 class="news-title">${newsTitle}</h3>
                <p class="news-excerpt">${newsContent}</p>
                ${adminActions}
            </div>
        `;
        newsFeed.appendChild(card);
    });
}

// Modal handling
if (createNewsBtn) {
    createNewsBtn.addEventListener('click', () => {
        if (newsForm) newsForm.reset();
        document.getElementById('news-id').value = '';
        if (modalTitle) modalTitle.textContent = 'Nueva Noticia';
        openModal();
    });
}

window.openEditModal = function (id) {
    const news = STATE.news.find(n => n.news_id === id);
    if (!news) return;

    document.getElementById('news-id').value = news.news_id;
    document.getElementById('news-title').value = news.title;
    document.getElementById('news-content').value = news.content;
    document.getElementById('news-image').value = ''; // Limpiar input file

    if (modalTitle) modalTitle.textContent = 'Editar Noticia';
    openModal();
};

function openModal() {
    if (newsModal) {
        newsModal.classList.remove('hidden');
        void newsModal.offsetWidth;
        newsModal.classList.add('visible');
    }
}

function closeModal() {
    if (newsModal) {
        newsModal.classList.remove('visible');
        setTimeout(() => {
            newsModal.classList.add('hidden');
        }, 300);
    }
}

closeModalSpans.forEach(span => span.addEventListener('click', closeModal));
if (newsModal) {
    newsModal.addEventListener('click', (e) => {
        if (e.target === newsModal) closeModal();
    });
}

if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('news-id').value;
        const title = document.getElementById('news-title').value;
        const content = document.getElementById('news-content').value;

        const imageInput = document.getElementById('news-image');
        const imageFile = imageInput.files.length > 0 ? imageInput.files[0] : null;

        // Para editar, necesitamos saber si mantener la imagen anterior si no se sube una nueva
        // Obtener la URL anterior del array STATE.news
        let finalImage = imageFile; // Por defecto es el archivo (o null)

        if (id && !imageFile) {
            // Si es edición y no hay archivo nuevo, buscamos la imagen actual
            const existingNews = STATE.news.find(n => n.news_id === parseInt(id));
            if (existingNews) {
                finalImage = existingNews.image_url; // Mantener URL existente
            }
        }

        if (id) {
            await updateNews(parseInt(id), title, content, finalImage);
        } else {
            await createNews(title, content, finalImage);
        }
        closeModal();
    });
}
