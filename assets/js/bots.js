// Bots Monitoring System - Main JavaScript

// State Management
const STATE = {
    currentUser: null,
    bots: [],
    filteredBots: [],
    incidents: [],
    filteredIncidents: [],
    subscription: null,
    filters: {
        system: '',
        status: '',
        environment: ''
    },
    timelineFilters: {
        botId: '',
        period: '30'
    }
};

// DOM Elements
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logout-btn');
const botsGrid = document.getElementById('bots-grid');
const incidentsTimeline = document.getElementById('incidents-timeline');
const adminControls = document.getElementById('admin-controls');

// Buttons
const createBotBtn = document.getElementById('create-bot-btn');
const createIncidentBtn = document.getElementById('create-incident-btn');
const manageSubscriptionsBtn = document.getElementById('manage-subscriptions-btn');

// Modals
const botModal = document.getElementById('bot-modal');
const incidentModal = document.getElementById('incident-modal');
const subscriptionModal = document.getElementById('subscription-modal');

// Forms
const botForm = document.getElementById('bot-form');
const incidentForm = document.getElementById('incident-form');
const subscriptionForm = document.getElementById('subscription-form');

// Filters
const systemFilter = document.getElementById('system-filter');
const statusFilter = document.getElementById('status-filter');
const environmentFilter = document.getElementById('environment-filter');
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
        fetchIncidents(),
        fetchUserSubscription()
    ]);
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

    welcomeMsg.textContent = `Hola, ${STATE.currentUser.username}`;

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
            STATE.filters = { system: '', status: '', environment: '' };
            systemFilter.value = '';
            statusFilter.value = '';
            environmentFilter.value = '';
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

    if (manageSubscriptionsBtn) {
        manageSubscriptionsBtn.addEventListener('click', () => {
            loadSubscriptionForm();
            openModal(subscriptionModal);
        });
    }

    // Form submissions
    if (botForm) {
        botForm.addEventListener('submit', handleBotSubmit);
    }

    if (incidentForm) {
        incidentForm.addEventListener('submit', handleIncidentSubmit);
    }

    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', handleSubscriptionSubmit);
    }

    // Close modals
    closeModalSpans.forEach(span => {
        span.addEventListener('click', () => {
            closeModal(botModal);
            closeModal(incidentModal);
            closeModal(subscriptionModal);
        });
    });

    // Teams webhook toggle
    const notifyTeams = document.getElementById('notify-teams');
    const teamsWebhookGroup = document.getElementById('teams-webhook-group');
    if (notifyTeams && teamsWebhookGroup) {
        notifyTeams.addEventListener('change', (e) => {
            teamsWebhookGroup.style.display = e.target.checked ? 'block' : 'none';
        });
    }
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

async function fetchUserSubscription() {
    if (!STATE.currentUser) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', STATE.currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        STATE.subscription = data;
    } catch (error) {
        console.error('Error fetching subscription:', error.message);
    }
}

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

// SUBSCRIPTION MANAGEMENT
function loadSubscriptionForm() {
    if (!STATE.subscription) {
        // Default values
        document.getElementById('sub-news').checked = false;
        document.getElementById('sub-bot-status').checked = false;
        document.getElementById('sub-incidents').checked = false;
        document.getElementById('notify-email').checked = true;
        document.getElementById('notify-teams').checked = false;
        document.getElementById('teams-webhook').value = '';
        document.querySelectorAll('.news-category-check').forEach(cb => cb.checked = false);
        return;
    }

    const sub = STATE.subscription;
    document.getElementById('sub-news').checked = sub.subscribe_news || false;
    document.getElementById('sub-bot-status').checked = sub.subscribe_bot_status || false;
    document.getElementById('sub-incidents').checked = sub.subscribe_incidents || false;
    document.getElementById('notify-email').checked = sub.notify_email || false;
    document.getElementById('notify-teams').checked = sub.notify_teams || false;
    document.getElementById('teams-webhook').value = sub.teams_webhook_url || '';

    // Show/hide teams webhook
    const teamsWebhookGroup = document.getElementById('teams-webhook-group');
    if (teamsWebhookGroup) {
        teamsWebhookGroup.style.display = sub.notify_teams ? 'block' : 'none';
    }

    // News categories
    const categories = sub.news_categories || [];
    document.querySelectorAll('.news-category-check').forEach(cb => {
        cb.checked = categories.includes(cb.value);
    });
}

async function handleSubscriptionSubmit(e) {
    e.preventDefault();

    const selectedCategories = Array.from(document.querySelectorAll('.news-category-check:checked'))
        .map(cb => cb.value);

    const subscriptionData = {
        user_id: STATE.currentUser.id,
        email: STATE.currentUser.email,
        subscribe_news: document.getElementById('sub-news').checked,
        subscribe_bot_status: document.getElementById('sub-bot-status').checked,
        subscribe_incidents: document.getElementById('sub-incidents').checked,
        news_categories: selectedCategories,
        notify_email: document.getElementById('notify-email').checked,
        notify_teams: document.getElementById('notify-teams').checked,
        teams_webhook_url: document.getElementById('teams-webhook').value,
        is_active: true
    };

    try {
        if (STATE.subscription) {
            // Update existing
            const { error } = await window.supabaseClient
                .from('subscriptions')
                .update(subscriptionData)
                .eq('subscription_id', STATE.subscription.subscription_id);

            if (error) throw error;
        } else {
            // Create new
            const { error } = await window.supabaseClient
                .from('subscriptions')
                .insert([subscriptionData]);

            if (error) throw error;
        }

        await fetchUserSubscription();
        closeModal(subscriptionModal);
        alert('Suscripciones guardadas exitosamente');
    } catch (error) {
        alert('Error al guardar suscripciones: ' + error.message);
    }
}
