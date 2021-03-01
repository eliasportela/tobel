const { ipcRenderer } = require('electron');

localStorage.removeItem('pauseWpp');

document.addEventListener("message_received", (e) => {
  ipcRenderer.send('asynchronous-message', e.detail)
}, false);

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  sendMessage(arg.from, { content: arg.msg }, () => {
    return null
  });

  // window.API.sendLinkMessage(arg.from, "Oiii: https://m.facebook.com/", "https://m.facebook.com/", () => {})
});

ipcRenderer.on('toggle-chat', (event, arg) => {
  const user = window.API.getActiveTab();

  if (user && user.id && user.id._serialized) {
    const dados = {
      text: arg,
      from: user.id._serialized
    };

    ipcRenderer.send('toggle-chat', dados);
  }
});

const is_read = setInterval(() => {
  if (localStorage.getItem('logout-token')) {
    // console.log("USUARIO LOGOUU");
    clearInterval(is_read);
    document.dispatchEvent(new CustomEvent('inject-script'));

  } else {
    console.log("WAITING TO LOGIN")
  }
}, 4000);
