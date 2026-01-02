// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Notificación Vortex', body: 'Nueva actualización' };

    const options = {
        body: data.body,
        icon: '/assets/img/logo.png', // Corrected path for Next.js public folder
        badge: '/assets/img/badge.png',
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

    // SECURITY: Validate URL is internal to prevent open redirect
    const url = event.notification.data.url || '/';
    const isInternalUrl = url.startsWith('/') || url.startsWith(self.location.origin);

    if (isInternalUrl) {
        event.waitUntil(
            clients.openWindow(url)
        );
    } else {
        console.warn('Blocked external URL redirect:', url);
    }
});
