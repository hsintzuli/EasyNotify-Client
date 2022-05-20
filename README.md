# EasyNotify-client
EasyNotify-client (this repository) is a Javascript client library for the browser that can receive all the notifications sent via Easy-Notify. As a push notification service,  Easy-Notify implements push notification in browser through [Web-Push](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) and [Socket.IO](https://socket.io/). To experice all the services, sign up for a free account on [easynotify.site](https://easynotify.site/).


## Install
```
npm i easy-notify-client
```
## Usage
#### Include easy-notify-client
You can include notifier.min.js as script file. 
```html
// In your html
<script src="/easy-notify-client/dist/notifier.min.js"></script>
<script> 
	// Access notifier through EasyNotify.notifier
	await EasyNotify.notifier.init() 

	// or
	const { notifier } = windoe.EasyNotify
	await notifier.init()
</script>
```
Or include easy-notify-client in your project using Webpack or other bundlers.
```javascript
import  { notifier }  from  "easy-notify-client";  
await notifier.init() 
```


#### Setting service woker for Web-Push
Web-Push requires a service worker script to register the service worker of your website.  For example, for the `example.com/index.html,` we need a Javascript file residing at `example.com/notify-sw.js`, so that we can register the service worker that will control `example.com/index.html`  as well as pages underneath it.

Create a notify-sw.js at the top scope of your folder:
  ```javascript
// (example) notify-sw.js:
const  channel = new  BroadcastChannel('Notify-sw');  //The name of BoradcastChannel is used to initialize the notifier

// Register event listener for the 'push' event.
self.addEventListener('push', async  function (event) {
	const  data = event.data ? event.data.json() : 'no payload';
	if (data.title === 'auth') {
		return  channel.postMessage(data);
		}
	channel.postMessage(data);

	// Keep the service worker alive until the notification is created.
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body:  data.body,
			icon:  data.icon,
			})
		);
	});
```

Once we've done, we can initialize the notifier through the path of service worker script and the broadcast channel.
In the example above, our service worker file located at '/notify-sw.js', and our broadcast channel is named as 'Notify-sw'.
  ```javascript
await notifier.init('/notify-sw.js', 'Notify-sw') 
```
Feel free to modify the name of service worker and broadcast channel as you want. You can also customize the behavior of your service worker is sw.js.


#### Set the push handler and subscribe to your channel!
  ```javascript
// Basic Example
import { notifier } from  './modules/notifier.js';

$(document).ready(async  function () {
	// Initialize notifier
	await notifier.init('/notify-sw.js', 'Notify-sw');
	
	// Set push hander to process the content of notification
	notifier.setPushHandler((data) => {
		console.log(data);
		}); 

	// Subcribe to your channel
	$('.subscribe-btn').click(async function (event) {
		event.preventDefault();
		await notifier.subscribe(YOUR CHANNELID, YOUR PUBLICKEY);
	});

	// Unsubcribe to your channel
	$('#unsubscribe').click(async function (event) {
		event.preventDefault();
		await notifier.unsubscribe();
	});
});
```

  

## API

notifier exposes four functions:
-   `init`
-   `setPushHandler`
-   `subscribe`
-   `unsubscribe`
#### init
The init function will initialize the SocketIO client and register the service worker. It takes two argument: Path of service worker script, Name of broadcast channel. If initialize successfully, return true, otherwise, return false.
```js
const initSuccess = await notifier.init(ServiceWorkerPath, BroadcastChannelName) 
```
  The default value of  ServiceWorkerPath is `'/notify-sw.js'`, and `'Notify-sw'` for BroadcastChannelName.

#### setPushHandler
The setPushHandler function requires a callback function that accept the one argument - the content of notification.
Attach any self‑defined setting in the config filed when sending the notification, you can easily adjust the notification layout by retrieving the configuration in the push handler

Set the handler manager to notifier

```js

notifier.setPushHandler((data) => {
	console.log('Test handler receive data', data);
    console.log('Test handler receive data', data);
    try {
      const { type } = JSON.parse(data.config);
      const handler = handlers[type];
      handler(data);
    } catch (error) {
      console.log('No config, just alert the notification');
      alert(data.title + '\n' + data.body);
    }
})

```

  Customize the notification through related tools, like [SweetAlert2](https://sweetalert2.github.io/) or [toastr](https://github.com/CodeSeven/toastr).

```js

const sweetHandler = (data) => {
	let { status } = JSON.parse(data.config);
	Swal.fire(data.title, data.body, status);
};

const toastrType = {
	success: toastr.success,
	warning: toastr.warning,
	error: toastr.error,
	};
const toastrHandler = (data) => {
	const { status } = JSON.parse(data.config);
	const handler = toastrType[status] || alert;
	handler(data.title, data.body);
};
const handlers = {
	sweetalert: sweetHandler,
	toastr: toastrHandler,
};
```

You can then try to send Notification with customize config through website or API like:

```json

/* use sweetalert in config*/
{
	"type":"sweetalert",
	"status":"success"
}
/* use toastr in config */
{
	"type":"toastr",
	"status":"success"
}
```

#### subscribe
The subscribe function requires two arguments: your Channel ID and Public Key.
You can find them by examine the channels in [easynotify.site](https://easynotify.site/management/apps).
If subscribe successfully, return true, otherwise, return false.
```js
// return true if subscribe successfully
const subscribeSuccess = await notifier.subscribe(ChannelID, PublicKey) 
```
Note: when the function is invoked, the browser will ask the permission of clients to allow push notification. You can prompt your clients through some UI.

#### unsubscribe
The unsubscribe function will remove the origin subscription.
If unsubscribe successfully, return true, otherwise, return false. 
```js
// return true if unsubscribe successfully
const unsubscribeSuccess = await notifier.unsubscribe() 
```
