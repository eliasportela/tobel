const { ipcRenderer } = require('electron');

document.addEventListener("btnLoad", (e) => {
    ipcRenderer.send('reloadUrl');
}, false);

document.addEventListener("message_received", (e) => {
    ipcRenderer.send('asynchronous-message', e.detail);
}, false);

document.addEventListener("toggle-reply", (e) => {
    ipcRenderer.send('toggle-chat', e.detail);
}, false);

ipcRenderer.on('open_chat', (event, arg) => {
    document.dispatchEvent(new CustomEvent('open-chat', { detail: arg }));
});

ipcRenderer.on('asynchronous-reply', (event, arg) => {
    const data = {detail: { from: arg.from, msg: { content: arg.msg, type: arg.type }}}
    document.dispatchEvent(new CustomEvent('send-message', data));
});

document.addEventListener("bot_number", (e) => {
    ipcRenderer.send('bot-number', e.detail);
}, false);

// dados do cliente
document.addEventListener("contact", (e) => {
    ipcRenderer.send('contact', e.detail);
}, false);

ipcRenderer.on('fill-contact', (event, arg) => {
    document.dispatchEvent(new CustomEvent('fill-contact', { detail: arg }));
});