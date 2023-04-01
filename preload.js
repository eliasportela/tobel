const { ipcRenderer } = require('electron');
localStorage.removeItem('pauseWpp');

document.addEventListener("btnLoad", (e) => {
    ipcRenderer.send('reloadUrl');
}, false);

document.addEventListener("login", (e) => {
    ipcRenderer.send('login', e.detail);
}, false);

document.addEventListener("message_received", (e) => {
    ipcRenderer.send('asynchronous-message', e.detail);
}, false);

document.addEventListener("toggle-reply", (e) => {
    ipcRenderer.send('toggle-chat', e.detail);
}, false);

document.addEventListener("go-page", (e) => {
    ipcRenderer.send('go-page', e.detail);
}, false);

ipcRenderer.on('asynchronous-reply', (event, arg) => {
    document.dispatchEvent(new CustomEvent('send-message', {
        detail: {
            from: arg.from,
            msg: { content: arg.msg, type: arg.type },
        }
    }));
});

// dados do cliente

document.addEventListener("contact", (e) => {
    ipcRenderer.send('contact', e.detail);
}, false);

ipcRenderer.on('fill-contact', (event, arg) => {
    document.dispatchEvent(new CustomEvent('fill-contact', { detail: arg }));
});
