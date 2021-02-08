'use strict'
/* global __static */

import { app, protocol, BrowserWindow, ipcMain, Menu, globalShortcut, dialog, shell } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const  fs = require('fs');
const path = require('path');
const isDevelopment = process.env.NODE_ENV !== 'production'
import fetch from 'electron-fetch'
import FormData from 'form-data'
import { autoUpdater } from "electron-updater"
const Config = require('electron-config');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36';

let win
let wpp
let messagebox = false;

let pauseWpp = false;
function createMenuContext(){
  return Menu.buildFromTemplate([
    {
      label: 'Opções',
      submenu: [
        {
          id: 1,
          label: pauseWpp ? 'Ativar LeBot' : 'Pausar LeBot',
          click: () => {
            desativarWpp();
            pauseWpp = !pauseWpp;
            Menu.setApplicationMenu(createMenuContext());
          }
        },
        {
          label: 'Deslogar',
          click: () => {
            logoutApp();
          }
        },
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Comandos LeBot',
          click: () => {
            messagebox = dialog.showMessageBox(wpp, {
              type: 'info',
              buttons: ['OK'],
              title: 'Comandos LeBot',
              message: 'Para usar basta digitar um dos comandas abaixo na conversa do cliente' +
                '\n\n1 - "Lebot Ok": Pausa o bot para o cliente.' +
                '\n\n2 - "Lebot Add": Adiciona o número do cliente a lista de bloqueados para o que o sistema nunca envie mensagem para ela de forma automática.' +
                '\n\n3 - "Lebot Remover": Remove o número do cliente da lista de bloqueados para o que o sistema volte a enviar mensagens automáticas.'
            }, () => {
              messagebox = false;
            });
          }
        },
      ]
    }
  ])
}

Menu.setApplicationMenu(createMenuContext())

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
    },
    icon: path.join(__static, 'icon.png')
  })
  win.setMenu(null);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
    checkUpdate();
  }

  win.on('closed', () => {
    app.quit()
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createWindow();

  globalShortcut.register('CommandOrControl+L', () => {
    win.webContents.openDevTools();

    if (wpp) {
      wpp.webContents.openDevTools();
    }
  })
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

let dados = {
  empresa: ''
};

function createWpp(data) {
  dados = data;

  wpp = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__static, 'preload.js'),
    },
    icon: path.join(__static, 'icon.png')
  });
  wpp.loadURL('https://web.whatsapp.com/');
  // if (!process.env.IS_TEST) wpp.webContents.openDevTools()

  wpp.on('closed', () => {
    app.quit()
  });

  wpp.webContents.on("new-window", function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });
}

function desativarWpp() {
  let script = pauseWpp ? 'localStorage.removeItem("pauseWpp", 1);' : 'localStorage.setItem("pauseWpp", 1);';
  wpp.webContents.executeJavaScript(script)
}

function logoutApp() {
  const config = new Config();
  config.clear();

  win.webContents.executeJavaScript('localStorage.clear();').then(() => {
    app.quit();
  })
}

ipcMain.on('import-scripts', (event, arg) => {
  const file = fs.readFileSync(__static + '/whatsapp.js', "utf8");
  wpp.webContents.executeJavaScript(file).then(() => {
    event.reply('is_ready_to_inject', dados);
  })
});

ipcMain.on('asynchronous-message', (event, arg) => {
  const form = new FormData();
  form.append('text', arg.text);
  form.append('user_id', arg.from);
  form.append('isMe', arg.isMe.toString());
  form.append('isGroupMsg', arg.isGroupMsg.toString());

  if (!arg.isMe) {
    if (arg.contact) {
      form.append('contact', arg.contact);
    }

    if (arg.number) {
      form.append('number', arg.number);
    }
  }

  fetch(process.env.VUE_APP_BASE_SERVER + "api/chatbot/" + dados.empresa, { method: 'POST', body: form })
    .then(res => res.json())
    .then(json => {
      if (json.success && json.msgs) {
        let i = 0;
        json.msgs.forEach(msg => {
          sendMessage(event, arg.from, msg, i++);
        })
      }
    }).catch(err => console.log(err));
});

function sendMessage(event, from, msg, i) {
  setTimeout(() => {
    event.reply('asynchronous-reply', { from, msg })
  }, 1000 * i);
}

ipcMain.on('login-lecard', (event, arg) => {
  if (!wpp) {
    win.hide();
    createWpp(arg);
  }
});

ipcMain.on('socket-event', (event, arg) => {
  if (messagebox || !wpp) {
    return;
  }

  const options = {
    type: 'warning',
    buttons: ['OK'],
    title: 'Solicitação de atendimento',
    message: (arg.telefone ? 'O cliente: ' + arg.telefone : 'Um cliente') + ' solicitou atendimento!',
  };

  messagebox = dialog.showMessageBox(wpp, options, () => {
    messagebox = false;
  });
});

ipcMain.on('socket-send', (event, arg) => {
  if (arg.to && arg.msg && Array.isArray(arg.msg) && wpp) {
    let i = 0;
    arg.msg.forEach(msg => {
      setTimeout(() => {
        wpp.webContents.send('asynchronous-reply', { from: arg.to, msg })
      }, 1000 * i);
    });
  }
});

function checkUpdate() {
  autoUpdater.checkForUpdates();

  autoUpdater.on('update-downloaded', (info) => {
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 4000);
  })
}
