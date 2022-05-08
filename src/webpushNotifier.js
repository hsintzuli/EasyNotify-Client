import axios  from "axios";

// Mimic service worker for unsupported browser or unsuccessfully registeration
class MimicSwRegistration {
  constructor() {
    this.pushManager = new MimicPushManager();
  }
}

// Mimic push manager for service worker
class MimicPushManager {
  getSubscription() {
    console.warn('[Webpush] No service worker avaliable');
    return Promise.resolve(null);
  }

  subscribe() {
    console.warn('[Webpush] No service worker avaliable');
    return Promise.resolve(null);
  }
}

class WebpushNotifier {
  #subscription;
  #channel; //broadcast channel that is used to receive message from the service worker
  #channelId;
  #publicKey;
  #sw;
  #pushHandler;

  constructor() {
    // this.#isSubscribed = false;
    this.#subscription = null;
    this.#channel = null;
    this.#channelId = '';
    this.#publicKey = '';
    this.#sw = new MimicSwRegistration();
    this.#pushHandler = function () {};
  }

  // Register the service worker to the browser and set the worker to this.#sw.
  // Set the push handler that process the notification content with default handler.
  async init(serviceWorkerPath, broadcastChannel) {
    if (!navigator || !'serviceWorker' in navigator || !'PushManager' in window) {
      console.warn('[Webpush] Push messaging is not supported');
      return;
    }
    try {
      const swReg = await navigator.serviceWorker.register(serviceWorkerPath);
      console.log('[Webpush] Service Worker is registered', swReg);
      this.#sw = swReg;
      this.#setPushListener(broadcastChannel);
    } catch (error) {
      console.warn('[Webpush] Service Worker Registered Error', error);
    }
  }

  // Create channel for receiving message from service worker.
  // Handle the notification message by this.#pushHandler.
  #setPushListener(broadcastChannel) {
    this.#channel = new BroadcastChannel(broadcastChannel);
    this.#channel.addEventListener('message', (event) => {
      if (event.data.title === 'auth') {
        axios
          .get(`https://easynotify.site/api/1.0/subscription/verify?code=${event.data.code}`)
          .then((res) => console.log('[Webpush] Receive subscription verification'))
          .catch((err) => console.log(err));
      } else {
        this.#ack(event.data.notification_id);
        this.#pushHandler(event.data);
      }
    });
  }

  // Check whether this notifier is subscribe to browser push service and set the subscription to this.subscription.
  async #isSubscribed() {
    const subscription = await this.#sw.pushManager.getSubscription();
    const isSubscribed = !(subscription === null);
    this.#subscription = subscription || null;
    return Promise.resolve(isSubscribed);
  }

  // Convert public key from base64 string to Uint8Array.
  #urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Subscribe to the browser push service with app public key and send the subscription information to easy-notify server.
  async #subscribe(channelId, publicKey) {
    this.#channelId = channelId || this.#channelId || '';
    this.#publicKey = publicKey || this.#publicKey || '';
    const subscriptionOptions = {
      applicationServerKey: this.#urlBase64ToUint8Array(publicKey),
      userVisibleOnly: true,
    };

    try {
      this.#subscription = await this.#sw.pushManager.subscribe(subscriptionOptions);
      console.log('[Webpush] New subscription', this.#subscription);
      if (this.#subscription) {
        console.log('[Webpush] Successfully subscribe to webpush server');
        const res = await axios.post(
          'https://easynotify.site/api/1.0/subscription',
          { channel_id: this.#channelId, subscription: this.#subscription },
          { headers: { 'content-type': 'application/json' } }
        );
        console.log('[Webpush] Send subscription to server');
        return true;
      }
    } catch (err) {
      throw new Error('[Webpush] subscribe error:', err);
    }
  }

  // Unsubscribe to the browser push service and send the unsubscription request to easy-notify server.
  async #unsubscribe() {
    const subscription = this.#subscription;
    try {
      await subscription.unsubscribe();
      const res = await axios.delete(
        'https://easynotify.site/api/1.0/subscription',
        { data: { endpoint: subscription.endpoint } },
        { headers: { 'content-type': 'application/json' } }
      );
      return console.log('[Webpush] Unsubscribe to server successfully');
    } catch (err) {
      throw new Error('[Webpush] unsubscribe error', err);
    }
  }

  // Update the existing subscription by delete the origin subscription and subscibe to new one.
  async #updateSubscription(channelId, newPublicKey) {
    const subscription = this.#subscription;
    if (!subscription || typeof subscription !== 'object') {
      console.log('Test: null subscription', subscription);
      return Promise.resolve(false);
    }

    // TODO: get the origin public key from PushSubscription
    // let existedSubscription = subscription.toJSON();
    // let oldPublicKey = existedSubscription.keys.p256dh;
    // console.log('old public key', oldPublicKey);
    // console.log('new public key', newPublicKey);
    // if (oldPublicKey === newPublicKey) {
    //   console.log('[Webpush] Already subscribe to the channel:', channelId);
    //   return Promise.resolve(flase);
    // }

    // Note: when the client subscribe to the same public key, the browser will generate the same endpoint.
    // When getting the subscribe request from the endpoint that already exists,
    // easy-notify server will only update the client's update time and reserve other client's information
    try {
      await this.#subscribe(channelId, newPublicKey);
    } catch (error) {
      console.warn('[Webpush]  Already subscribe to other channel. Update the original subscription');
      await this.#unsubscribe();
      await this.#subscribe(channelId, newPublicKey);
    }
  }

  // After receiving push notifcation, ack to easy-notify server
  #ack(id) {
    axios
      .get(`https://easynotify.site/api/1.0/subscription/tracking?id=${id}`)
      .then((res) => console.log('[Websocket] ack to received notification successfully'))
      .catch((err) => console.log(err));
  }

  // Examine the arguements required for subscribing and check whther the norifier is subscribed already.
  async subscribe(channelId, publicKey) {
    if (!channelId || typeof channelId !== 'string' || !publicKey || typeof publicKey !== 'string') {
      return console.warn(`[Websocket] invalid channel_id or public_key to subscribe`);
    }

    const subscribed = await this.#isSubscribed();
    if (subscribed) {
      await this.#updateSubscription(channelId, publicKey);
    } else {
      await this.#subscribe(channelId, publicKey);
    }
  }

  // Check whther the norifier is subscribed already and unsubscribe.
  async unsubscribe() {
    const subscribed = await this.#isSubscribed();
    if (!subscribed) {
      return console.log('[Webpush] no subscription to unsubscribe');
    }
    await this.#unsubscribe();
  }

  // Set the hander for web-push notification
  setPushHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('[Webpush] handler must be a function');
    }
    this.#pushHandler = handler;
  }
}

export { WebpushNotifier };
