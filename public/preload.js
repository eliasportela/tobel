const { ipcRenderer } = require('electron');
// import swal from 'sweetalert';

document.addEventListener("message_received", (e) => {
  ipcRenderer.send('asynchronous-message', e.detail)
}, false);

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  window.WappBot.prepareMessageToSend(arg.msg, arg.from)
});

ipcRenderer.on('is_ready_to_inject', (event, arg) => {
  localStorage.removeItem('pauseWpp');

  let is_read = setInterval(() => {
    if (localStorage.getItem('logout-token')) {
      console.log("USUARIO LOGOUU");
      clearInterval(is_read);
      document.dispatchEvent(new CustomEvent('inject-script'))
    } else {
      console.log("USUARIO AINDA NAO ESTA LOGADO")
    }
  }, 5000)

});

document.addEventListener("DOMContentLoaded", function(event) {
  setTimeout(() => {
    ipcRenderer.send('import-scripts')
  }, 5000);
});
