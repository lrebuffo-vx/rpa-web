// State Management
const STATE = {
    currentUser: null,
    news: [],
    filteredNews: [],
    filters: {
        search: '',
        category: '',
        tag: ''
    }
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

// Filter elements
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const tagFilter = document.getElementById('tag-filter');
const clearFiltersBtn = document.getElementById('clear-filters');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupFilterListeners();
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

// --- FILTER AND SEARCH FUNCTIONALITY ---

function setupFilterListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            STATE.filters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300));
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            STATE.filters.category = e.target.value;
            applyFilters();
        });
    }

    if (tagFilter) {
        tagFilter.addEventListener('change', (e) => {
            STATE.filters.tag = e.target.value;
            applyFilters();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            STATE.filters = { search: '', category: '', tag: '' };
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (tagFilter) tagFilter.value = '';
            applyFilters();
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function applyFilters() {
    let filtered = [...STATE.news];

    // Search filter
    if (STATE.filters.search) {
        filtered = filtered.filter(news => {
            const searchTerm = STATE.filters.search;
            const titleMatch = news.title?.toLowerCase().includes(searchTerm);
            const contentMatch = news.content?.toLowerCase().includes(searchTerm);
            const tagsMatch = news.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
            // You could also add author search here if you fetch author info
            return titleMatch || contentMatch || tagsMatch;
        });
    }

    // Category filter
    if (STATE.filters.category) {
        filtered = filtered.filter(news => news.category === STATE.filters.category);
    }

    // Tag filter
    if (STATE.filters.tag) {
        filtered = filtered.filter(news => news.tags?.includes(STATE.filters.tag));
    }

    STATE.filteredNews = filtered;
    renderNews();
}

async function fetchNews() {
    try {
        const { data, error } = await window.supabaseClient
            .from('news')
            .select('*')
            .order('priority', { ascending: false })
            .order('published_at', { ascending: false });

        if (error) throw error;

        STATE.news = data || [];
        applyFilters(); // Apply filters after fetching
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

async function createNews(title, content, imageFile, category, tags, isFeatured, priority) {
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
                    author_id: STATE.currentUser.id,
                    category: category || 'Comunicados',
                    tags: tags || [],
                    is_featured: isFeatured || false,
                    priority: priority || 0
                }
            ]);

        if (error) throw error;
        fetchNews();

    } catch (error) {
        console.error('Error creating news:', error.message);
        alert('Error al crear noticia: ' + error.message);
    }
}

async function updateNews(id, title, content, image, category, tags, isFeatured, priority) {
    try {
        let imageUrl = image;

        // Si 'image' es un objeto File (nuevo archivo seleccionado), lo subimos
        if (image instanceof File) {
            imageUrl = await uploadImage(image);
            if (!imageUrl) return;
        }

        const { error } = await window.supabaseClient
            .from('news')
            .update({
                title,
                content,
                image_url: imageUrl,
                category: category || 'Comunicados',
                tags: tags || [],
                is_featured: isFeatured || false,
                priority: priority || 0
            })
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

    const newsToRender = STATE.filteredNews.length > 0 || Object.values(STATE.filters).some(f => f)
        ? STATE.filteredNews
        : STATE.news;

    if (newsToRender.length === 0) {
        newsFeed.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No se encontraron noticias.</p>';
        return;
    }

    newsToRender.forEach(news => {
        const card = document.createElement('div');
        let cardClasses = 'news-card fade-in';

        // Add featured class
        if (news.is_featured) {
            cardClasses += ' featured';
        }

        // Add priority classes
        if (news.priority >= 8) {
            cardClasses += ' priority-critical';
        } else if (news.priority >= 5) {
            cardClasses += ' priority-high';
        }

        card.className = cardClasses;

        const imageUrl = news.image_url;
        const newsTitle = news.title;
        const newsContent = news.content;
        const newsId = news.news_id;
        const newsDate = news.published_at || news.created_at;
        const newsCategory = news.category || 'Comunicados';
        const newsTags = news.tags || [];

        const imageHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${newsTitle}" class="news-image" onclick="showNewsDetail(${newsId})">`
            : `<div class="news-image" style="background: linear-gradient(45deg, #1e293b, #334155); display:flex; align-items:center; justify-content:center; color:#64748b; cursor: pointer;" onclick="showNewsDetail(${newsId})"><span>Sin Imagen</span></div>`;

        // Category badge with emoji
        const categoryEmojis = {
            'Bots': '🤖',
            'Incidentes': '⚠️',
            'Mejoras': '✨',
            'Release': '🚀',
            'Comunicados': '📢'
        };
        const categoryClass = `category-${newsCategory.toLowerCase()}`;
        const categoryBadge = `<span class="news-category ${categoryClass}">${categoryEmojis[newsCategory] || '📢'} ${newsCategory}</span>`;

        // Tags
        let tagsHtml = '';
        if (newsTags.length > 0) {
            tagsHtml = '<div class="news-tags">' +
                newsTags.map(tag => `<span class="news-tag">${tag}</span>`).join('') +
                '</div>';
        }

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
                ${categoryBadge}
                <span class="news-date">${dateStr}</span>
                <h3 class="news-title">${newsTitle}</h3>
                <p class="news-excerpt">${newsContent}</p>
                ${tagsHtml}
                ${adminActions}
            </div>
        `;
        newsFeed.appendChild(card);
    });
}

// Modal de detalle de noticia
window.showNewsDetail = function (id) {
    const news = STATE.news.find(n => n.news_id === id);
    if (!news) return;

    const dateStr = new Date(news.published_at || news.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const imageHtml = news.image_url
        ? `<img src="${news.image_url}" alt="${news.title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;">`
        : '';

    const detailModal = document.createElement('div');
    detailModal.className = 'modal visible';
    detailModal.innerHTML = `
        <div class="modal-content glass-panel" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
            <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            <h2 style="margin-bottom: 10px;">${news.title}</h2>
            <p style="color: var(--primary-color); font-size: 0.9rem; margin-bottom: 20px;">${dateStr}</p>
            ${imageHtml}
            <div style="color: var(--text-muted); line-height: 1.8; white-space: pre-wrap;">${news.content}</div>
        </div>
    `;

    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) detailModal.remove();
    });

    document.body.appendChild(detailModal);
};


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
    document.getElementById('news-category').value = news.category || 'Comunicados';
    document.getElementById('news-tags').value = (news.tags || []).join(', ');
    document.getElementById('news-featured').checked = news.is_featured || false;
    document.getElementById('news-priority').value = news.priority || 0;
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
        const category = document.getElementById('news-category').value;
        const tagsInput = document.getElementById('news-tags').value;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const isFeatured = document.getElementById('news-featured').checked;
        const priority = parseInt(document.getElementById('news-priority').value) || 0;

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
            await updateNews(parseInt(id), title, content, finalImage, category, tags, isFeatured, priority);
        } else {
            await createNews(title, content, finalImage, category, tags, isFeatured, priority);
        }
        closeModal();
    });
}
