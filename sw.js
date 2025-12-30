// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Notificación Vortex', body: 'Nueva actualización' };

    const options = {
        body: data.body,
        icon: 'assets/img/logo.png', // Make sure this exists or use a generic one
        badge: 'assets/img/badge.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
