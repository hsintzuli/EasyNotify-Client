import { io } from "socket.io-client";
import axios  from "axios";
class MimicSocket {
  emit() {
    console.warn('[Websocket] No socket client avaliable');
  }
  on() {
    console.warn('[Websocket] No socket client avaliable');
  }
  off() {
    console.warn('[Websocket] No socket client avaliable');
  }
}

// Websocket client
class SocketNotifier {
  #socket;
  #pushHandler;
  #channel_id;

  constructor() {
    this.#socket = new MimicSocket();
    this.#pushHandler = function () {};
    this.#channel_id = null;
  }

  // Initalize Websocket Client
  init() {
    const socket = io('https://notify.easynotify.site', { transports: ['websocket', 'polling'] });

    // Register socket client when socket connect successfully
    socket.on('connect', () => {
      console.log('[Websocket] connect successfully');
      const engine = socket.io.engine;

      engine.on('close', (reason) => {
        console.log('[Websocket] connection is closed');
        this.#setSocket();
      });

      this.#setSocket(socket);
    });
  }

  // Set the SocketIO client
  #setSocket(socket) {
    this.#socket = socket && socket.connected ? socket : new MimicSocket();
  }

  // Set the handler for the notification that SocketIO client received
  // Everytime this function is called, remove the origin handler and set the new one
  #setPushHandler(handler) {
    this.#pushHandler = handler || this.#pushHandler;
    this.#socket.off('push');
    this.#socket.on('push', (data) => {
      const { code } = data;
      this.#ack(code);
      this.#pushHandler(data);
    });
  }

  #ack(id) {
    axios
      .get(`https://easynotify.site/api/1.0/subscription/tracking?id=${id}`)
      .then((res) => console.log('[Websocket] ack to received notification successfully'))
      .catch((err) => console.log(err));
  }

  // Subcribe to the specific channel
  subscribe(channel_id) {
    if (!channel_id || typeof channel_id !== 'string') {
      return console.warn(`[Websocket] invalid channel_id to subscribe`);
    }

    this.#socket = this.#socket || new MimicSocket();
    if (this.#channel_id === channel_id) {
      return console.log(`[Websocket] already subscribe to channel ${channel_id}`);
    }

    // Subscribe to websocket server
    this.#channel_id = channel_id;
    this.#socket.emit('subscribe', { channel_id });
    console.log(`[Websocket] subscribe to channel ${channel_id} successfully `);
    this.#socket.on('push', (data) => {
      if (data.code) this.#ack(data.code);
      if (data.title) {
        this.#ack(data.notification_id);
        this.#pushHandler(data);
      }
    });
  }

  // Unsubscribe to websocket server
  unsubscribe() {
    const channel_id = this.#channel_id;
    this.#socket.emit('unsubscribe', { channel_id });
    this.#channel_id = '';
    console.log(`[Websocket] unsubscribe to channel ${channel_id} successfully`);
  }

  // Set the hander for websocket notification
  setPushHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('[Websocket] handler must be a function');
    }
    this.#setPushHandler(handler);
  }
}

export { SocketNotifier };
