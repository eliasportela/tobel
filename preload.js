const { ipcRenderer } = require('electron');
const os = require("node:os");

sessionStorage.setItem('Electron', '1');
window.Electron = true;
window.gPConfigs = { host: os.hostname() };

// lebot web
document.addEventListener("login", (e) => {
    ipcRenderer.send('login', e.detail);
}, false);

document.addEventListener("toggleBot", (e) => {
    ipcRenderer.send('toggleBot', e.detail);
}, false);

document.addEventListener("toggleWpp", (e) => {
    ipcRenderer.send('toggleWpp', e.detail);
}, false);

document.addEventListener("toggleStatus", (e) => {
    ipcRenderer.send('toggleStatus', e.detail);
}, false);

document.addEventListener("dispararMensagens", (e) => {
    ipcRenderer.send('dispararMensagens', e.detail);
}, false);

document.addEventListener("acessarChat", (e) => {
    ipcRenderer.send('acessarChats', e.detail);
}, false);

document.addEventListener("fechar", (e) => {
    ipcRenderer.send('fechar', e.detail);
}, false);

document.addEventListener("update", (e) => {
    ipcRenderer.send('update', e.detail || {});
}, false);

document.addEventListener("markUnread", (e) => {
    ipcRenderer.send('markUnread', e.detail);
}, false);

// send
ipcRenderer.on('wppSession', (event, arg) => {
    document.dispatchEvent(new CustomEvent('wpp_session', { detail: arg }));
});

ipcRenderer.on('lebotStatus', (event, arg) => {
    document.dispatchEvent(new CustomEvent('lebot_config', { detail: arg }));
});

ipcRenderer.on('errorReply', (event, arg) => {
    document.dispatchEvent(new CustomEvent('error_reply', { detail: arg }));
});

ipcRenderer.on('requestHuman', (event, arg) => {
    document.dispatchEvent(new CustomEvent('request_human'));
});

ipcRenderer.on('updateReply', (event, arg) => {
    document.dispatchEvent(new CustomEvent('updateReply', { detail: arg }));
});

ipcRenderer.on('updateProgress', (event, arg) => {
    document.dispatchEvent(new CustomEvent('updateProgress', { detail: arg }));
})