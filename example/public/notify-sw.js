// From service-worker.js:
const channel = new BroadcastChannel('Notify-sw');

// Register event listener for the 'push' event.
self.addEventListener('push', async function (event) {
  const data = event.data ? event.data.json() : 'no payload';
  if (data.title === 'auth') {
    return channel.postMessage(data);
  }
  channel.postMessage(data);
  // Keep the service worker alive until the notification is created.
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
    })
  );
});
