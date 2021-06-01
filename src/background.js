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

// ************** ELECTRON CONFIGS **************//

let win;
let wpp;
let messagebox = false;
let dados = { empresa: '', base_url: process.env.VUE_APP_BASE_SERVER };
let pauseWpp = false;
let quit = true;

if (!isDevelopment) {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe')
  });
}

function createMenuContext(createDev){
  const menus = [
    {
      label: 'Opcões',
      submenu: [
        {
          label: pauseWpp ? 'Ativar o Bot' : 'Pausar o LeBot',
          click: () => {
            desativarWpp();
            pauseWpp = !pauseWpp;
            Menu.setApplicationMenu(createMenuContext());
          }
        },
        {
          label: 'Configurações',
          click: () => {
            quit = false;
            win.show();
          }
        },
        {
          label: 'Logout',
          click: () => {
            logoutApp();
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Comandos Bot',
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
        {
          label: 'Licença',
          click: () => {
            messagebox = dialog.showMessageBox(wpp, {
              type: 'info',
              buttons: ['OK'],
              title: 'Lincença',
              message: 'Empresa: ' + (dados.dados ? dados.dados.nome_fantasia : "") + '\nStatus: Ativo\nVersão: ' + app.getVersion()
            }, () => {
              messagebox = false;
            });
          }
        },
      ]
    },
    {
      label: 'Chat',
      submenu: [
        {
          label: 'Pausar usuário',
          click: () => {
            toggleChat('lebot ok');
          }
        },
        {
          label: 'Adicionar usuário à Blocklist',
          click: () => {
            toggleChat('lebot add');
          }
        },
        {
          label: 'Remover usuário da Blocklist',
          click: () => {
            toggleChat('lebot remover');
          }
        }
      ]
    },
  ];

  if (createDev) {
    const config = new Config();
    const isHomolog = !!config.get('homologacao');

    menus.push({
      label: 'Dev',
      submenu: [
        {
          label: 'DevTools',
          click: () => {
            win.webContents.openDevTools();
            if (wpp) {
              wpp.webContents.openDevTools();
            }
          }
        },
        {
          label: (isHomolog ? 'Sair' : 'Modo') + ' Homologação',
          click: () => {
            config.clear();

            if (!isHomolog) {
              config.set('homologacao', 'true');
            }

            win.webContents.executeJavaScript('localStorage.clear();').then(() => {
              app.quit();
            })
          }
        }
      ]
    })
  }

  return Menu.buildFromTemplate(menus);
}

Menu.setApplicationMenu(createMenuContext());

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);
app.commandLine.appendSwitch('--autoplay-policy','no-user-gesture-required');
app.setAppUserModelId('delivery.lecard.whatsapp');

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 450,
    height: 480,
    resizable: false,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
    },
    icon: path.join(__static, 'icon.png')
  });
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

  win.on('close', function(e){
    if(!quit){
      e.preventDefault();
      win.hide();
      quit = true;
    }
  });

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
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createWindow();
  globalShortcut.register('CommandOrControl+B', () => {
    Menu.setApplicationMenu(createMenuContext(true));
  })
});

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

function createWpp(data) {
  dados = data;

  wpp = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__static, 'preload.js'),
    },
    icon: path.join(__static, 'icon.png')
  });
  wpp.loadURL('https://web.whatsapp.com/');

  wpp.webContents.on('dom-ready', function(e) {
    const file = fs.readFileSync(__static + '/api.js', "utf8");
    wpp.webContents.executeJavaScript(file);

    const file2 = fs.readFileSync(__static + '/whatsapp.js', "utf8");
    wpp.webContents.executeJavaScript(file2);

    wpp.webContents.executeJavaScript('sessionStorage.setItem("nome_fantasia", "'+ data.dados.nome_fantasia +'");');

    if (data.dados.url_imagem) {
      wpp.webContents.executeJavaScript('sessionStorage.setItem("url_imagem", "'+ data.dados.url_imagem +'");');
    }
  });

  wpp.on('closed', () => {
    app.quit()
  });

  wpp.webContents.on("new-window", function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  wpp.once('focus', () => {
    wpp.flashFrame(false)
  });

  wpp.maximize();
  wpp.show();
}

// ************ FUNCOES ************ //

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

function checkUpdate() {
  autoUpdater.checkForUpdates();

  autoUpdater.on('update-downloaded', (info) => {
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 4000);
  })
}

function sendToServer(event, arg) {
  const form = new FormData();
  form.append('text', arg.text);
  form.append('user_id', arg.from);
  form.append('isMe', arg.isMe.toString());
  form.append('isAudio', arg.isAudio ? 'true' : 'false');
  form.append('location', arg.location ? JSON.stringify(arg.location) : '');

  if (!arg.isMe) {
    if (arg.contact) {
      form.append('contact', arg.contact);
    }

    if (arg.number) {
      form.append('number', arg.number);
    }
  }

  fetch(dados.base_url + "api/chatbot/" + dados.empresa, { method: 'POST', body: form })
    .then(res => res.json())
    .then(json => {
      if (json.success && json.msgs) {
        if (event) {
          let i = 0;
          json.msgs.forEach(msg => {
            sendMessage(event, arg.from, msg, i++);
          })
        }
      }
    }).catch(err => console.log(err));
}

function sendMessage(event, from, msg, i) {
  setTimeout(() => {
    event.reply('asynchronous-reply', { from, msg })
  }, 1000 * i);
}

function toggleChat(msg) {
  wpp.webContents.send('toggle-chat', msg);
}

// ************ IPC MAINS ************ //

ipcMain.on('toggle-wpp', (event, arg) => {
  win.hide();
  quit = true;

  if (arg && !wpp) {
    createWpp(arg);
  }
});

ipcMain.on('asynchronous-message', (event, arg) => {
  sendToServer(event, arg)
});

ipcMain.on('focus', () => {
  if (wpp) {
    wpp.show()
  }
});

ipcMain.on('socket-event', (event, arg) => {
  if (messagebox || !wpp) {
    return;
  }

  wpp.flashFrame(true);

  const options = {
    type: 'warning',
    buttons: ['OK'],
    title: 'Solicitação de atendimento',
    message: (arg.telefone ? 'O cliente: ' + arg.telefone : 'Um cliente') + ' solicitou atendimento!',
  };

  messagebox = dialog.showMessageBox(wpp, options, () => {
    messagebox = false;
    wpp.flashFrame(false);
    wpp.show();
    event.reply('toggle-notification', false);
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

ipcMain.on('toggle-chat', (event, arg) => {
  if (arg && arg.from && arg.text) {
    const dados = {
      from: arg.from,
      text: arg.text,
      isMe: true
    };
    sendToServer(event, dados);
  }
});

// ************ IPC MAINS ************ //
