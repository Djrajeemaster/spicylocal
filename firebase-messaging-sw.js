// Service worker for scope /bagit/ — use COMPAT builds only
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');



const messaging = firebase.messaging();

// Background notifications
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "SpicyBeats Alert";
  const body  = (payload.notification && payload.notification.body)  || "";
  self.registration.showNotification(title, {
    body,
    icon: "/bagit/icon.png" // adjust if needed
  });
});

// Optional: ensure clicks focus/open your app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes("/bagit/") && "focus" in client) return client.focus();
      }
      return clients.openWindow("/bagit/");
    })
  );
});

