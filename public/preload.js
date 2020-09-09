const {ipcRenderer} = require('electron');

document.addEventListener("message_received", (e) => {
  ipcRenderer.send('asynchronous-message', e.detail)
}, false);

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  window.WappBot.prepareMessageToSend(arg.msg, arg.from)
});

ipcRenderer.on('is_ready_to_inject', (event, arg) => {
  localStorage.setItem('empresa', arg.dados.nome_fantasia);
  localStorage.setItem('url_site', arg.dados.site);
  localStorage.setItem('elias', 'Douglas');

  let is_read = setInterval(() => {
    if (localStorage.getItem('logout-token')) {
      console.log("USUARIO LOGOUU")
      clearInterval(is_read)
      document.dispatchEvent(new CustomEvent('inject-script'))
    } else {
      console.log("USUARIO AINDA NAO ESTA LOGADO")
    }
  }, 5000)

});

localStorage.setItem('users', JSON.stringify([]));

document.addEventListener("DOMContentLoaded", function(event) {
  setTimeout(() => {
    ipcRenderer.send('import-scripts')
  }, 5000)
});
