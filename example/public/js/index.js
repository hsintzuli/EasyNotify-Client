toastr.options = {
  closeButton: false,
  progressBar: true,
  positionClass: 'toast-top-right',
  showDuration: '300',
  timeOut: '5000',
  extendedTimeOut: '1000',
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut',
};
const toastrType = {
  success: toastr.success,
  warning: toastr.warning,
  error: toastr.error,
};
hljs.initHighlightingOnLoad()
const sweetHandler = (data) => {
  let { status } = JSON.parse(data.config);
  Swal.fire(data.title, data.body, status);
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

$(document).ready(async function () {
  await EasyNotify.notifier.init();
  EasyNotify.notifier.setPushHandler((data) => {
    console.log('Test handler receive data', data);
    try {
      const { type } = JSON.parse(data.config);
      const handler = handlers[type];
      handler(data);
    } catch (error) {
      console.log('No config, just alert the notification')
      alert(data.title + '\n' + data.body)
    }
  });

  $('#subscribe').click(async function (event) {
    event.preventDefault();
    const channelId = $('#channel-id').val();
    const publicKey = $('#public-key').val();
    await EasyNotify.notifier.subscribe(channelId, publicKey);
    toastr.success('Subscribe successfully');
  });

  $('#unsubscribe').click(async function (event) {
    event.preventDefault();
    await EasyNotify.notifier.unsubscribe();
    toastr.success('Unsubscribe successfully');
  });
});
