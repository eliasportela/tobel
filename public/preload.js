const { ipcRenderer } = require('electron');

localStorage.removeItem('pauseWpp');

document.addEventListener("message_received", (e) => {
  ipcRenderer.send('asynchronous-message', e.detail);
}, false);

document.addEventListener("toggle-reply", (e) => {
  toggleChat(e.detail);
}, false);

document.addEventListener("go-page", (e) => {
  ipcRenderer.send('go-page', e.detail);
}, false);

ipcRenderer.on('asynchronous-reply', (event, arg) => {
  sendMessage(arg.from, { content: arg.msg }, () => {
    return null
  });

  // window.API.sendLinkMessage(arg.from, "Oiii: https://m.facebook.com/", "https://m.facebook.com/", () => {})
});

ipcRenderer.on("fill-blocklist", (event, arg) => {
  fillBlockList(arg);
}, false);

ipcRenderer.on('toggle-chat', (event, arg) => {
  toggleChat(arg);
});

function toggleChat(arg) {
  const user = window.API.getActiveTab();

  if (user && user.id && user.id._serialized) {
    const user_id = user.id._serialized;

    const dados = {
      text: arg,
      from: user_id
    };

    ipcRenderer.send('toggle-chat', dados);
  }
}
