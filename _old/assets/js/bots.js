// Bots Monitoring System - Main JavaScript

// State Management
window.STATE = {
    currentUser: null,
    bots: [],
    filteredBots: [],
    incidents: [],
    filteredIncidents: [],
    filters: {
        system: '',
        status: '',
        environment: '',
        client: ''
    },
    timelineFilters: {
        botId: '',
        period: '30'
    }
};
const STATE = window.STATE;

// DOM Elements
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');
const botsGrid = document.getElementById('bots-grid');
const incidentsTimeline = document.getElementById('incidents-timeline');
const adminControls = document.getElementById('admin-controls');

// Buttons
const createBotBtn = document.getElementById('create-bot-btn');
const createIncidentBtn = document.getElementById('create-incident-btn');

// Modals
const botModal = document.getElementById('bot-modal');
const incidentModal = document.getElementById('incident-modal');

// Forms
const botForm = document.getElementById('bot-form');
const incidentForm = document.getElementById('incident-form');

// Filters
const systemFilter = document.getElementById('system-filter');
const statusFilter = document.getElementById('status-filter');
const environmentFilter = document.getElementById('environment-filter');
const clientFilter = document.getElementById('client-filter');
const clearBotFilters = document.getElementById('clear-bot-filters');
const timelineBotFilter = document.getElementById('timeline-bot-filter');
const timelinePeriodFilter = document.getElementById('timeline-period-filter');

// Close modal spans
const closeModalSpans = document.querySelectorAll('.close-modal, .close-modal-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
});

// SESSION CHECK
async function checkSession() {
    if (!window.supabaseClient) {
        console.error('Supabase Client no disponible.');
        window.location.href = 'index.html';
        return;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = 'index.html';
        return;
    }

    await fetchUserProfile(session.user);
    await Promise.all([
        fetchBots(),
        fetchIncidents()
    ]);

    // SECURITY: Setup session refresh every 30 minutes
    setupSessionRefresh();
}

// SECURITY: Auto-refresh session to prevent expiration
function setupSessionRefresh() {
    setInterval(async () => {
        try {
            const { data, error } = await window.supabaseClient.auth.refreshSession();
            if (error) {
                console.error('Session refresh failed:', error);
                window.location.href = 'index.html';
            } else {
                console.log('Session refreshed successfully');
            }
        } catch (err) {
            console.error('Session refresh error:', err);
            window.location.href = 'index.html';
        }
    }, 30 * 60 * 1000); // 30 minutes
}

async function fetchUserProfile(authUser) {
    if (!authUser) return;

    let role = 'user';

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
        console.error('Error fetching user profile:', e);
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

// EVENT LISTENERS
function setupEventListeners() {
    // Filter listeners
    if (systemFilter) {
        systemFilter.addEventListener('change', () => {
            STATE.filters.system = systemFilter.value;
            applyBotFilters();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            STATE.filters.status = statusFilter.value;
            applyBotFilters();
        });
    }

    if (environmentFilter) {
        environmentFilter.addEventListener('change', () => {
            STATE.filters.environment = environmentFilter.value;
            applyBotFilters();
        });
    }

    if (clearBotFilters) {
        clearBotFilters.addEventListener('click', () => {
            STATE.filters = { system: '', status: '', environment: '', client: '' };
            systemFilter.value = '';
            statusFilter.value = '';
            environmentFilter.value = '';
            if (clientFilter) clientFilter.value = '';
            applyBotFilters();
        });
    }

    if (clientFilter) {
        clientFilter.addEventListener('change', () => {
            STATE.filters.client = clientFilter.value;
            applyBotFilters();
        });
    }

    // Timeline filters
    if (timelineBotFilter) {
        timelineBotFilter.addEventListener('change', () => {
            STATE.timelineFilters.botId = timelineBotFilter.value;
            applyIncidentFilters();
        });
    }

    if (timelinePeriodFilter) {
        timelinePeriodFilter.addEventListener('change', () => {
            STATE.timelineFilters.period = timelinePeriodFilter.value;
            applyIncidentFilters();
        });
    }

    // Modal buttons
    if (createBotBtn) {
        createBotBtn.addEventListener('click', () => {
            botForm.reset();
            document.getElementById('bot-id').value = '';
            document.getElementById('bot-modal-title').textContent = 'Nuevo Bot';
            openModal(botModal);
        });
    }

    if (createIncidentBtn) {
        createIncidentBtn.addEventListener('click', () => {
            incidentForm.reset();
            document.getElementById('incident-id').value = '';
            document.getElementById('incident-modal-title').textContent = 'Reportar Incidente';
            populateBotSelect();
            openModal(incidentModal);
        });
    }
    // Form submissions
    if (botForm) {
        botForm.addEventListener('submit', handleBotSubmit);
    }

    if (incidentForm) {
        incidentForm.addEventListener('submit', handleIncidentSubmit);
    }

    // Close modals
    closeModalSpans.forEach(span => {
        span.addEventListener('click', () => {
            closeModal(botModal);
            closeModal(incidentModal);
        });
    });
}

// FETCH DATA
async function fetchBots() {
    try {
        const { data, error } = await window.supabaseClient
            .from('bots')
            .select('*')
            .order('status', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        STATE.bots = data || [];
        applyBotFilters();
        updateStatusSummary();
        populateTimelineBotFilter();
        populateClientFilter();
    } catch (error) {
        console.error('Error fetching bots:', error.message);
        if (botsGrid) botsGrid.innerHTML = '<p>Error cargando bots.</p>';
    }
}

async function fetchIncidents() {
    try {
        const { data, error } = await window.supabaseClient
            .from('incidents')
            .select(`
                *,
                bots (name, system)
            `)
            .order('started_at', { ascending: false });

        if (error) throw error;

        STATE.incidents = data || [];
        applyIncidentFilters();
    } catch (error) {
        console.error('Error fetching incidents:', error.message);
        if (incidentsTimeline) incidentsTimeline.innerHTML = '<p>Error cargando incidentes.</p>';
    }
}

// (Subscription moved to notifications.js)

// FILTERS
function applyBotFilters() {
    let filtered = [...STATE.bots];

    if (STATE.filters.system) {
        filtered = filtered.filter(bot => bot.system === STATE.filters.system);
    }

    if (STATE.filters.status) {
        filtered = filtered.filter(bot => bot.status === STATE.filters.status);
    }

    if (STATE.filters.environment) {
        filtered = filtered.filter(bot => bot.environment === STATE.filters.environment);
    }

    if (STATE.filters.client) {
        filtered = filtered.filter(bot => bot.client === STATE.filters.client);
    }

    STATE.filteredBots = filtered;
    renderBots();
}

function applyIncidentFilters() {
    let filtered = [...STATE.incidents];

    if (STATE.timelineFilters.botId) {
        filtered = filtered.filter(inc => inc.bot_id === parseInt(STATE.timelineFilters.botId));
    }

    if (STATE.timelineFilters.period !== 'all') {
        const daysAgo = parseInt(STATE.timelineFilters.period);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        filtered = filtered.filter(inc => new Date(inc.started_at) >= cutoffDate);
    }

    STATE.filteredIncidents = filtered;
    renderIncidents();
}

// UPDATE STATUS SUMMARY
function updateStatusSummary() {
    const operativo = STATE.bots.filter(b => b.status === 'operativo').length;
    const observacion = STATE.bots.filter(b => b.status === 'observacion').length;
    const caido = STATE.bots.filter(b => b.status === 'caido').length;

    document.getElementById('count-operativo').textContent = operativo;
    document.getElementById('count-observacion').textContent = observacion;
    document.getElementById('count-caido').textContent = caido;
    document.getElementById('count-total').textContent = STATE.bots.length;
}

// RENDER BOTS
function renderBots() {
    if (!botsGrid) return;
    botsGrid.innerHTML = '';

    const botsToRender = STATE.filteredBots.length > 0 || Object.values(STATE.filters).some(f => f)
        ? STATE.filteredBots
        : STATE.bots;

    if (botsToRender.length === 0) {
        botsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🤖</div>
                <h3>No se encontraron bots</h3>
                <p>No hay bots que coincidan con los filtros seleccionados.</p>
            </div>
        `;
        return;
    }

    botsToRender.forEach(bot => {
        const card = createBotCard(bot);
        botsGrid.appendChild(card);
    });
}

function createBotCard(bot) {
    const card = document.createElement('div');
    card.className = `bot-card status-${bot.status}`;

    const statusEmoji = {
        'operativo': '🟢',
        'observacion': '🟡',
        'caido': '🔴'
    };

    const statusText = {
        'operativo': 'Operativo',
        'observacion': 'En Observación',
        'caido': 'Caído'
    };

    const environmentClass = bot.environment?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const lastUpdate = new Date(bot.last_status_update).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let adminActions = '';
    if (STATE.currentUser && STATE.currentUser.role === 'admin') {
        adminActions = `
            <div class="bot-actions">
                <button class="btn-secondary" onclick="openEditBotModal(${bot.bot_id})">Editar</button>
                <button class="btn-danger" onclick="deleteBot(${bot.bot_id})">Eliminar</button>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="bot-header">
            <div>
                <span class="bot-system">${bot.system || 'Sistema'}</span>
                <span class="environment-badge ${environmentClass}">${bot.environment || 'Producción'}</span>
                <h3 class="bot-name">${bot.name}</h3>
            </div>
            <div class="bot-status-badge ${bot.status}">
                <span>${statusEmoji[bot.status]}</span>
                <span>${statusText[bot.status]}</span>
            </div>
        </div>
        <p class="bot-description">${bot.description || 'Sin descripción'}</p>
        <div class="bot-meta">
            <div class="bot-meta-item">
                <span>⏰</span>
                <span><strong>Última actualización:</strong> ${lastUpdate}</span>
            </div>
            ${bot.client ? `
                <div class="bot-meta-item">
                    <span>🏢</span>
                    <span><strong>Cliente:</strong> ${bot.client}</span>
                </div>
            ` : ''}
            ${bot.responsible_name ? `
                <div class="bot-meta-item">
                    <span>👤</span>
                    <span><strong>Responsable:</strong> ${bot.responsible_name}</span>
                </div>
            ` : ''}
            ${bot.responsible_email ? `
                <div class="bot-meta-item">
                    <span>📧</span>
                    <span><a href="mailto:${bot.responsible_email}">${bot.responsible_email}</a></span>
                </div>
            ` : ''}
            ${bot.related_news_id ? `
                <div class="bot-meta-item">
                    <span>📰</span>
                    <span><a href="dashboard.html#news-${bot.related_news_id}">Ver noticia relacionada</a></span>
                </div>
            ` : ''}
        </div>
        ${adminActions}
    `;

    return card;
}

// RENDER INCIDENTS
function renderIncidents() {
    if (!incidentsTimeline) return;
    incidentsTimeline.innerHTML = '';

    const incidentsToRender = STATE.filteredIncidents;

    if (incidentsToRender.length === 0) {
        incidentsTimeline.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No hay incidentes registrados</h3>
                <p>No se encontraron incidentes en el período seleccionado.</p>
            </div>
        `;
        return;
    }

    incidentsToRender.forEach(incident => {
        const item = createIncidentItem(incident);
        incidentsTimeline.appendChild(item);
    });
}

function createIncidentItem(incident) {
    const item = document.createElement('div');
    item.className = `incident-item impact-${incident.impact_level?.toLowerCase()}`;

    const startDate = new Date(incident.started_at).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const botName = incident.bots?.name || 'Bot desconocido';
    const botSystem = incident.bots?.system || '';

    let adminActions = '';
    if (STATE.currentUser && STATE.currentUser.role === 'admin') {
        adminActions = `
            <div class="incident-actions">
                <button class="btn-secondary" onclick="openEditIncidentModal(${incident.incident_id})">Editar</button>
                <button class="btn-danger" onclick="deleteIncident(${incident.incident_id})">Eliminar</button>
            </div>
        `;
    }

    item.innerHTML = `
        <div class="incident-header">
            <div>
                <h3 class="incident-title">${incident.title}</h3>
                <div class="incident-bot-name">🤖 ${botName} ${botSystem ? `(${botSystem})` : ''}</div>
            </div>
            <div class="incident-badges">
                <span class="incident-badge impact ${incident.impact_level?.toLowerCase()}">${incident.impact_level}</span>
                <span class="incident-badge status ${incident.status?.toLowerCase().replace(' ', '-')}">${incident.status}</span>
            </div>
        </div>
        <div class="incident-date">📅 ${startDate}</div>
        ${incident.description ? `<p class="incident-description">${incident.description}</p>` : ''}
        <div class="incident-details">
            ${incident.root_cause ? `
                <div class="incident-detail">
                    <div class="incident-detail-label">🔍 Causa Raíz</div>
                    <div class="incident-detail-value">${incident.root_cause}</div>
                </div>
            ` : ''}
            ${incident.resolution ? `
                <div class="incident-detail">
                    <div class="incident-detail-label">✅ Resolución</div>
                    <div class="incident-detail-value">${incident.resolution}</div>
                </div>
            ` : ''}
            ${incident.lessons_learned ? `
                <div class="incident-detail">
                    <div class="incident-detail-label">💡 Lecciones Aprendidas</div>
                    <div class="incident-detail-value">${incident.lessons_learned}</div>
                </div>
            ` : ''}
        </div>
        ${adminActions}
    `;

    return item;
}

// POPULATE SELECTS
function populateBotSelect() {
    const incidentBotSelect = document.getElementById('incident-bot');
    if (!incidentBotSelect) return;

    incidentBotSelect.innerHTML = '<option value="">Seleccionar bot...</option>';
    STATE.bots.forEach(bot => {
        const option = document.createElement('option');
        option.value = bot.bot_id;
        option.textContent = `${bot.name} (${bot.system})`;
        incidentBotSelect.appendChild(option);
    });
}

function populateTimelineBotFilter() {
    if (!timelineBotFilter) return;

    timelineBotFilter.innerHTML = '<option value="">Todos los Bots</option>';
    STATE.bots.forEach(bot => {
        const option = document.createElement('option');
        option.value = bot.bot_id;
        option.textContent = `${bot.name} (${bot.system})`;
        timelineBotFilter.appendChild(option);
    });
}

function populateClientFilter() {
    if (!clientFilter) return;

    const clients = [...new Set(STATE.bots.map(bot => bot.client).filter(c => c))];
    const currentValue = clientFilter.value;

    clientFilter.innerHTML = '<option value="">Todos</option>';
    clients.sort().forEach(client => {
        const option = document.createElement('option');
        option.value = client;
        option.textContent = client;
        clientFilter.appendChild(option);
    });

    clientFilter.value = currentValue;
}

// MODAL FUNCTIONS
function openModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.add('visible');
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

// BOT CRUD
async function handleBotSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('bot-id').value;
    const botData = {
        name: document.getElementById('bot-name').value,
        description: document.getElementById('bot-description').value,
        system: document.getElementById('bot-system').value,
        environment: document.getElementById('bot-environment').value,
        client: document.getElementById('bot-client').value,
        status: document.getElementById('bot-status').value,
        responsible_name: document.getElementById('bot-responsible-name').value,
        responsible_email: document.getElementById('bot-responsible-email').value
    };

    try {
        if (id) {
            await updateBot(parseInt(id), botData);
        } else {
            await createBot(botData);
        }
        closeModal(botModal);
    } catch (error) {
        alert('Error al guardar bot: ' + error.message);
    }
}

async function createBot(botData) {
    const { error } = await window.supabaseClient
        .from('bots')
        .insert([botData]);

    if (error) throw error;
    await fetchBots();
}

async function updateBot(id, botData) {
    const { error } = await window.supabaseClient
        .from('bots')
        .update(botData)
        .eq('bot_id', id);

    if (error) throw error;

    // Disparar notificación si cambió el estado
    const oldBot = STATE.bots.find(b => b.bot_id === id);
    if (oldBot && oldBot.status !== botData.status && window.triggerNotification) {
        window.triggerNotification('bot_status', { name: botData.name, status: botData.status });
    }

    await fetchBots();
}

window.openEditBotModal = function (id) {
    const bot = STATE.bots.find(b => b.bot_id === id);
    if (!bot) return;

    document.getElementById('bot-id').value = bot.bot_id;
    document.getElementById('bot-name').value = bot.name;
    document.getElementById('bot-description').value = bot.description || '';
    document.getElementById('bot-system').value = bot.system || '';
    document.getElementById('bot-environment').value = bot.environment || 'Producción';
    document.getElementById('bot-client').value = bot.client || '';
    document.getElementById('bot-status').value = bot.status;
    document.getElementById('bot-responsible-name').value = bot.responsible_name || '';
    document.getElementById('bot-responsible-email').value = bot.responsible_email || '';

    document.getElementById('bot-modal-title').textContent = 'Editar Bot';
    openModal(botModal);
};

window.deleteBot = async function (id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este bot?')) return;

    try {
        const { error } = await window.supabaseClient
            .from('bots')
            .delete()
            .eq('bot_id', id);

        if (error) throw error;
        await fetchBots();
    } catch (error) {
        alert('Error al eliminar bot: ' + error.message);
    }
};

// INCIDENT CRUD
async function handleIncidentSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('incident-id').value;
    const incidentData = {
        bot_id: parseInt(document.getElementById('incident-bot').value),
        title: document.getElementById('incident-title').value,
        description: document.getElementById('incident-description').value,
        impact_level: document.getElementById('incident-impact').value,
        status: document.getElementById('incident-status').value,
        root_cause: document.getElementById('incident-root-cause').value,
        resolution: document.getElementById('incident-resolution').value,
        lessons_learned: document.getElementById('incident-lessons').value,
        reported_by: STATE.currentUser.id
    };

    try {
        if (id) {
            await updateIncident(parseInt(id), incidentData);
        } else {
            await createIncident(incidentData);
        }
        closeModal(incidentModal);
    } catch (error) {
        alert('Error al guardar incidente: ' + error.message);
    }
}

async function createIncident(incidentData) {
    const { error } = await window.supabaseClient
        .from('incidents')
        .insert([incidentData]);

    if (error) throw error;

    // Disparar notificación
    if (window.triggerNotification) {
        window.triggerNotification('incident', { title: incidentData.title, bot_id: incidentData.bot_id });
    }

    await fetchIncidents();
}

async function updateIncident(id, incidentData) {
    const { error } = await window.supabaseClient
        .from('incidents')
        .update(incidentData)
        .eq('incident_id', id);

    if (error) throw error;
    await fetchIncidents();
}

window.openEditIncidentModal = function (id) {
    const incident = STATE.incidents.find(i => i.incident_id === id);
    if (!incident) return;

    populateBotSelect();

    document.getElementById('incident-id').value = incident.incident_id;
    document.getElementById('incident-bot').value = incident.bot_id;
    document.getElementById('incident-title').value = incident.title;
    document.getElementById('incident-description').value = incident.description || '';
    document.getElementById('incident-impact').value = incident.impact_level;
    document.getElementById('incident-status').value = incident.status;
    document.getElementById('incident-root-cause').value = incident.root_cause || '';
    document.getElementById('incident-resolution').value = incident.resolution || '';
    document.getElementById('incident-lessons').value = incident.lessons_learned || '';

    document.getElementById('incident-modal-title').textContent = 'Editar Incidente';
    openModal(incidentModal);
};

window.deleteIncident = async function (id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este incidente?')) return;

    try {
        const { error } = await window.supabaseClient
            .from('incidents')
            .delete()
            .eq('incident_id', id);

        if (error) throw error;
        await fetchIncidents();
    } catch (error) {
        alert('Error al eliminar incidente: ' + error.message);
    }
};

// SUBSCRIPTION MANAGEMENT moved to notifications.js
