import { SocketNotifier } from './socketNotifier.js';
import { WebpushNotifier } from './webpushNotifier.js';

const defaultSwPath = 'notify-sw.js';
const defaultBroadcastChannel = 'Notify-sw';

class Notifier {
  constructor() {
    this.isInit = false;
    this.socketNotifier = new SocketNotifier();
    this.WebpushNotifier = new WebpushNotifier();
  }

  // Initialize notifier, create new SocketIO client and register service worker.
  // The script of serviceworker is required for web-push.
  async init(serviceWorkerPath = defaultSwPath, broadcastChannel = defaultBroadcastChannel) {
    if (this.isInit) {
      return console.warn('The notifier has already been initialized');
    }
    try {
      this.socketNotifier.init();
      await this.WebpushNotifier.init(serviceWorkerPath, broadcastChannel);
      this.isInit = true;
    } catch (error) {
      console.error(error);
    }
  }

  // Set the handler for push event.
  // The handler must be a function that accept one argument, which is the notification content.
  setPushHandler(handler) {
    try {
      this.socketNotifier.setPushHandler(handler);
      this.WebpushNotifier.setPushHandler(handler);
    } catch (error) {
      console.error(error);
    }
  }

  // Subscribe to the specific channel.
  // Notifier will start to listen on push notification after successfully subscribed.
  async subscribe(channelId, publicKey) {
    try {
      this.socketNotifier.subscribe(channelId);
      await this.WebpushNotifier.subscribe(channelId, publicKey);
    } catch (error) {
      console.error(error);
    }
  }

  // Unsubscribe to the channel that are now subscribing.
  async unsubscribe() {
    try {
      this.socketNotifier.unsubscribe();
      await this.WebpushNotifier.unsubscribe();
    } catch (error) {
      console.error(error);
    }
  }
}

const notifier = new Notifier();
export { notifier };
