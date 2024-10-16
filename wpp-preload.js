const { ipcRenderer } = require('electron');
let empresa = {};

ipcRenderer.on('set_empresa', (event, arg) => {
    empresa = arg;
});

document.addEventListener("message_received", (e) => {
    ipcRenderer.send('asynchronous-message', { ...e.detail, token: empresa.token });
}, false);

document.addEventListener("toggle-reply", (e) => {
    ipcRenderer.send('toggle-chat', { ...e.detail, token: empresa.token });
}, false);

document.addEventListener("bot_number", (e) => {
    ipcRenderer.send('bot-number', {
        phone: e.detail,
        key: empresa.key,
        token: empresa.token,
        wpp: empresa.wpp,
        id_empresa: empresa.id_empresa,
        bandeiras: empresa.bandeiras
    });
}, false);

ipcRenderer.on('open_chat', (event, arg) => {
    document.dispatchEvent(new CustomEvent('open-chat', { detail: arg }));
});

ipcRenderer.on('asynchronous-reply', (event, arg) => {
    document.dispatchEvent(new CustomEvent('send-message', { detail: arg }));
});

ipcRenderer.on('mark_unread', (event, arg) => {
    document.dispatchEvent(new CustomEvent('mark-unread', { detail: arg }));
});

ipcRenderer.on('fill-contact', (event, arg) => {
    document.dispatchEvent(new CustomEvent('fill-contact', { detail: arg }));
});

// dados do cliente
document.addEventListener("contact", (e) => {
    ipcRenderer.send('contact', {
        id_empresa: empresa.id_empresa,
        token: empresa.token,
        from: e.detail.from,
    });
}, false);