/**
 * Notifications & Subscriptions Manager
 * Handles: Subscription Modal, Email Preferences, and Browser Push Notifications
 */

const NOTIF_STATE = {
    subscription: null,
    registration: null,
    publicVapidKey: 'BK6FXgjsT-6d4am8J83vjYsx82FwD2I6MLB258PELdfX7f6Dtzf6bNH9pvFzmj5oPoUez5kHWEw-b4ARgZAcj2w' // Final VAPID key
};

// DOM Elements
const manageSubscriptionsBtn = document.getElementById('manage-subscriptions-btn');
const subscriptionModal = document.getElementById('subscription-modal');
const subscriptionForm = document.getElementById('subscription-form');
const notifCloseModalSpans = document.querySelectorAll('.close-modal, .close-modal-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNotifications();
});

async function initNotifications() {
    setupNotifEventListeners();
    await checkPushSupport();
    // We expect window.supabaseClient and STATE.currentUser to be available from the main script
    // If not, we wait a bit or use a more robust check
    setTimeout(async () => {
        if (window.supabaseClient && window.STATE && window.STATE.currentUser) {
            await fetchUserSubscription();
        }
    }, 500);
}

function setupNotifEventListeners() {
    if (manageSubscriptionsBtn) {
        manageSubscriptionsBtn.addEventListener('click', () => {
            loadSubscriptionForm();
            openNotifModal(subscriptionModal);
        });
    }

    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', handleSubscriptionSubmit);
    }

    // Modal close
    notifCloseModalSpans.forEach(span => {
        span.addEventListener('click', () => {
            closeNotifModal(subscriptionModal);
        });
    });
}

async function fetchUserSubscription() {
    if (!window.STATE || !window.STATE.currentUser) return;
    const user = window.STATE.currentUser;

    try {
        const { data, error } = await window.supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        NOTIF_STATE.subscription = data;
        if (window.STATE) {
            window.STATE.subscription = data; // Keep in sync with main state if exists
        }
    } catch (error) {
        console.error('Error fetching subscription:', error.message);
    }
}

function loadSubscriptionForm() {
    if (!NOTIF_STATE.subscription) {
        // Default values
        document.getElementById('sub-news').checked = false;
        document.getElementById('sub-bot-status').checked = false;
        document.getElementById('sub-incidents').checked = false;
        document.querySelectorAll('.news-category-check').forEach(cb => cb.checked = false);
        return;
    }

    const sub = NOTIF_STATE.subscription;
    document.getElementById('sub-news').checked = sub.subscribe_news || false;
    document.getElementById('sub-bot-status').checked = sub.subscribe_bot_status || false;
    document.getElementById('sub-incidents').checked = sub.subscribe_incidents || false;

    const categories = sub.news_categories || [];
    document.querySelectorAll('.news-category-check').forEach(cb => {
        cb.checked = categories.includes(cb.value);
    });
}

async function handleSubscriptionSubmit(e) {
    e.preventDefault();

    if (!window.STATE || !window.STATE.currentUser) {
        alert('Error: Sesión de usuario no encontrada. Por favor, recarga la página.');
        return;
    }
    const user = window.STATE.currentUser;

    const selectedCategories = Array.from(document.querySelectorAll('.news-category-check:checked'))
        .map(cb => cb.value);

    // Try to get push subscription if not already subscribed
    let pushSubscription = await subscribeToPush();

    const subscriptionData = {
        user_id: user.id,
        email: user.email,
        subscribe_news: document.getElementById('sub-news').checked,
        subscribe_bot_status: document.getElementById('sub-bot-status').checked,
        subscribe_incidents: document.getElementById('sub-incidents').checked,
        news_categories: selectedCategories,
        notify_email: false,
        notify_teams: false,
        teams_webhook_url: '',
        push_subscription: pushSubscription || (NOTIF_STATE.subscription ? NOTIF_STATE.subscription.push_subscription : null),
        is_active: true
    };

    try {
        let error;
        if (NOTIF_STATE.subscription) {
            const { error: err } = await window.supabaseClient
                .from('subscriptions')
                .update(subscriptionData)
                .eq('subscription_id', NOTIF_STATE.subscription.subscription_id);
            error = err;
        } else {
            const { error: err } = await window.supabaseClient
                .from('subscriptions')
                .insert([subscriptionData]);
            error = err;
        }

        if (error) throw error;

        await fetchUserSubscription();
        closeNotifModal(subscriptionModal);
        alert('Suscripciones guardadas exitosamente');
    } catch (error) {
        alert('Error al guardar suscripciones: ' + error.message);
    }
}

// PUSH NOTIFICATIONS
async function checkPushSupport() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:' || isLocal;

    if (!isSecure) {
        console.warn('Push Notifications requieren HTTPS o localhost. Protocolo actual:', window.location.protocol);
        return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            NOTIF_STATE.registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registrado');
        } catch (error) {
            console.error('Error registrando Service Worker:', error);
        }
    } else {
        console.warn('Push Notifications no soportadas por el navegador');
    }
}

async function subscribeToPush() {
    if (!NOTIF_STATE.registration) return null;

    try {
        const subscription = await NOTIF_STATE.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(NOTIF_STATE.publicVapidKey)
        });
        console.log('Usuario suscrito a Push:', subscription);
        return subscription;
    } catch (error) {
        console.error('Error suscribiendo a Push:', error);
        return null;
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// DISPATCH NOTIFICATIONS
async function triggerNotification(type, data) {
    console.log(`Disparando notificación tipo ${type}:`, data);

    try {
        // En un entorno productivo con Supabase, esto se manejaría preferiblemente
        // mediante Database Triggers + Edge Functions.
        // Aquí implementamos la lógica de disparo desde el cliente para demostración.

        // 1. Obtener suscriptores interesados
        const { data: subscribers, error } = await window.supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        subscribers.forEach(sub => {
            let shouldNotify = false;

            if (type === 'news' && sub.subscribe_news) {
                // Verificar categoría si aplica
                if (!sub.news_categories || sub.news_categories.length === 0 || sub.news_categories.includes(data.category)) {
                    shouldNotify = true;
                }
            } else if (type === 'bot_status' && sub.subscribe_bot_status) {
                shouldNotify = true;
            } else if (type === 'incident' && sub.subscribe_incidents) {
                shouldNotify = true;
            }

            if (shouldNotify) {
                if (sub.push_subscription) {
                    sendPushNotification(sub.push_subscription, type, data);
                }
            }
        });
    } catch (error) {
        console.error('Error al procesar notificaciones:', error);
    }
}

async function sendPushNotification(pushSub, type, data) {
    console.log(`📱 Enviando Push a suscripción:`, pushSub);
    // Para enviar un Push real se necesita una clave privada VAPID y un servidor backend
}

// Exportar para uso en otros scripts
window.triggerNotification = triggerNotification;

// MODAL HELPERS
function openNotifModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.add('visible');
    }
}

function closeNotifModal(modal) {
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}
