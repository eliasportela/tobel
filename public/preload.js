const { ipcRenderer } = require('electron');

// document.addEventListener("action_active_tab", (e) => {
//   console.log(e)
// }, false);

document.addEventListener("message_received", (e) => {
  ipcRenderer.send('asynchronous-message', e.detail)
}, false);

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  window.WappBot.prepareMessageToSend(arg.msg, arg.from)
});

ipcRenderer.on('reply-image', (event, arg) => {
  window.WappBot.prepareImageToSend(arg.from, {
    content: '',
    filename: "teste.png",
    caption: "hummmm, olha so ísso!",
  })
});

ipcRenderer.on('toggle-chat', (event, arg) => {
  const dados = {
    text: arg,
    from: window.WAPI.getChatActive()
  };

  ipcRenderer.send('toggle-chat', dados);
});

ipcRenderer.on('is_ready_to_inject', (event, arg) => {
  localStorage.removeItem('pauseWpp');

  let is_read = setInterval(() => {
    if (localStorage.getItem('logout-token')) {
      // console.log("USUARIO LOGOUU");
      clearInterval(is_read);
      document.dispatchEvent(new CustomEvent('inject-script'));

    } else {
      console.log("WAITING TO LOGIN")
    }
  }, 4000)
});
