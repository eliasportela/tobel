// Modules to control application life and create native browser window
const {app, BrowserWindow, BrowserView, ipcMain, Menu, dialog, globalShortcut, session } = require('electron');
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Ha duas instancias abertas');
  app.quit();
  return;
}

const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const FormData = require('form-data');
const Config = require('electron-config');
const fetch = require('electron-fetch').default;

const env = JSON.parse(fs.readFileSync(path.join(__dirname, './config.json'), 'utf8'));
const base_login = env.BASE_LOGIN;
const config = new Config();

let base_server = null;
let api_lebot = null;

let win = null;
let wpp = null;
let winLoad = null;

let dados = null;
let id_empresa = null;
let version = null;
let pauseWpp = !!config.get('pauseWpp');
let showVersionAvaliable = false;
let botNumber = null;

app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36';
Menu.setApplicationMenu(createMenuContext());

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.setAppUserModelId('delivery.lecard.whatsapp');

app.whenReady().then(() => {
  createWindow();

  winLoad = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'icon.png')
  });

  winLoad.loadFile("pages/loading.html");

  app.on('activate', function () {
    // if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });

  globalShortcut.register('CommandOrControl+B', () => {
    Menu.setApplicationMenu(createMenuContext(true));
  });

  loadDependences();
})

app.on('window-all-closed', function () {
  app.quit();
})

// Funcoes
function createWindow () {
  win = new BrowserWindow({
    title: 'LeBot',
    width: 1000,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#1CC88A',
    show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL(base_login).then(() => {
    if (app.isPackaged) {
      checkAutoUpdater();
    }

  }).catch(() => {
    win.loadFile('pages/error.html');
  });

  win.once('ready-to-show', () => {
    setTimeout(() => {
      winLoad.close();
      win.show();
      win.focus();
    }, 2000);
  });

  win.on('closed', () => {
    app.quit()
  });

  win.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });
}

function createBot(data) {
  wpp = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      preload: path.join(__dirname, 'wpp-preload.js')
    }
  });

  win.setBrowserView(wpp);
  wpp.setBounds({ x: 74, y: 0, width: 910, height: 519 });
  wpp.webContents.loadURL("https://web.whatsapp.com/");
  wpp.setAutoResize({width: true, height: true});
  win.title = `Lebot - ${data.dados.nome_fantasia}`;

  wpp.webContents.on('dom-ready', function(e) {
    setTimeout(() => {
      win.maximize();
      toggleStatus();
      downloadApi();
      wpp.webContents.focus();
    }, 2000);
  });
}

function downloadApi() {
  if (!api_lebot) {
    try {
      const file = fs.readFileSync(__dirname + '/assets/api.js', "utf8");
      injectScript(file);

    } catch (error) {
      console.log('api lebot file error', error);
      showInjectError();
    }

  } else {
    try {
      fetch(api_lebot, { method: 'GET' })
          .then(res => res.text())
          .then(text => {
            if (text) {
              injectScript(text);

            } else {
              showInjectError();
            }

          }).catch(err => {
            console.log('api lebot error', err);
            showInjectError();
          }
      );
    } catch (error) {
      console.log('api lebot error 2', error);
      showInjectError();
    }
  }
}

function injectScript(text) {
  wpp.webContents.executeJavaScript(text);

  const file2 = fs.readFileSync(__dirname + '/assets/whatsapp.js', "utf8");
  wpp.webContents.executeJavaScript(file2);

  const file3 = fs.readFileSync(__dirname + '/assets/custom.css', "utf8");
  wpp.webContents.insertCSS(file3);
}

function showInjectError() {
  dialog.showMessageBox(win, {
    title: 'Erro ao iniciar',
    type: 'info',
    buttons: ['OK'],
    message: 'Não foi possível iniciar o LeBot. Por favor reinicie o sistema.'
  });
}

function createMenuContext(createDev){
  const menus = [
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Comandos Bot',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              buttons: ['OK'],
              title: 'Comandos LeBot',
              message: 'Para usar basta digitar um dos comandas abaixo na conversa do cliente' +
                  '\n\n1 - "Lebot Ok": Pausa o bot para o cliente.' +
                  '\n\n2 - "Lebot Add": Adiciona o número do cliente a lista de bloqueados para o que o sistema nunca envie mensagem para ela de forma automática.' +
                  '\n\n3 - "Lebot Remover": Remove o número do cliente da lista de bloqueados para o que o sistema volte a enviar mensagens automáticas.' +
                  '\n\n4 - "Lebot Iniciar": Mandar mensagem de boas-vindas para o cliente.' +
                  '\n\n5 - "Lebot Menu": Envia o link de pedidos ou uma imagem com o cardápio/promoção.'
            });
          }
        },
        {
          label: 'Verificar atualizações',
          enabled: true,
          click() {
            showVersionAvaliable = true;
            autoUpdater.checkForUpdates()
          },
        },
        {
          label: 'Licença',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              buttons: ['OK'],
              title: 'Lincença',
              message: 'Empresa: ' + (dados.dados ? dados.dados.nome_fantasia : "") + '\nStatus: Ativo\nVersão: ' + version
            });
          }
        },
      ]
    },
    {
      label: 'Editar',
      submenu: [
        {
          label: 'Desfazer',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: 'Refazer',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cortar',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: 'Copiar',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: 'Colar',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: 'Selecionar',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll',
        }
      ]
    }
  ];

  if (createDev) {
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
        }
      ]
    })
  }

  return Menu.buildFromTemplate(menus);
}

function toggleStatus() {
  if (wpp) {
    const code = pauseWpp ? 'localStorage.setItem("pauseWpp", 1);' : 'localStorage.removeItem("pauseWpp", 1);';
    wpp.webContents.executeJavaScript(code);

    if (pauseWpp) {
      config.set('pauseWpp', 'true');

    } else {
      config.delete('pauseWpp');
    }
  }

  win.webContents.send('lebotStatus', { pauseWpp: pauseWpp, version: version });
}

function sendToServer(event, arg) {
  const form = new FormData();
  form.append('text', arg.text);
  form.append('user_id', arg.from);
  form.append('isMe', arg.isMe.toString());
  form.append('isAudio', arg.isAudio ? 'true' : 'false');
  form.append('location', arg.location ? JSON.stringify(arg.location) : '');
  form.append('botNumber', arg.botNumber ? arg.botNumber : '');

  if (!arg.isMe) {
    if (arg.contact) {
      form.append('contact', arg.contact);
    }

    if (arg.number) {
      form.append('number', arg.number);
    }
  }

  fetch(base_server + "api/chatbot/" + dados.empresa, { method: 'POST', body: form })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.msgs && event) {
          let delay = 0;
          let type = json.type || 'text';
          let read = json.read === '1';

          json.msgs.forEach(msg => {
            event.reply('asynchronous-reply', { from: arg.from, msg, type, read, delay, create: false });
            delay += 2000;
          });

          if (json.request_human) {
            // win.webContents.send('requestHuman');
            setTimeout(() => {
              event.reply('mark_unread', arg.from);
            }, (json.msgs.length * 3000));
          }
        }
      }).catch(err => console.log(err));
}

// Eventos
ipcMain.on('reloadUrl', () => {
  win.loadURL(base_login).then(() => {}).catch(() => {
    win.loadFile('pages/error.html');
  });
});

function loadDependences() {
  version = app.getVersion();

  ipcMain.on('login', (event, arg) => {
    if (arg && arg.token) {
      dados = arg;
      api_lebot = dados.api_lebot || null;
      id_empresa = dados && dados.dados ? dados.dados.id_empresa : null;

      if (dados.base_server) {
        base_server = dados.base_server;
      }

      if (!wpp && base_server) {
        createBot(dados);
      }
    }
  });

  ipcMain.on('toggleBot', (event, arg) => {
    let bot = !!win.getBrowserView();

    if (arg !== bot) {
      if (arg) {
        win.setBrowserView(wpp)
        win.setResizable(true);
        win.maximize();

      } else {
        win.setResizable(false);
        win.removeBrowserView(wpp);
      }
    }
  });

  ipcMain.on('toggleStatus', (event, arg) => {
    pauseWpp = !pauseWpp;
    Menu.setApplicationMenu(createMenuContext());
    toggleStatus();
  });

  ipcMain.on('asynchronous-message', (event, arg) => {
    sendToServer(event, arg)
  });

  ipcMain.on('toggle-chat', (event, arg) => {
    if (arg && arg.from && arg.text) {
      sendToServer(event, { from: arg.from, text: arg.text, isMe: true });
    }
  });

  ipcMain.on('contact', (event, arg) => {
    if (id_empresa && arg && arg.from) {
      const url = base_server + "api/chatbot/contato/"+ dados.token +"?id=" + arg.from + "&id_empresa=" + id_empresa;
      fetch(url, { method: 'GET' })
          .then(res => res.json())
          .then(json => {
            if (event) {
              event.reply('fill-contact', json)
            }
          }).catch(err => console.log(err));
    }
  });

  ipcMain.on('bot-number', (event, phone) => {
    if (phone) {
      console.log('Wpp Session: ' + phone);
      botNumber = phone;
      win.webContents.send('wppSession', phone);
    }
  });

  ipcMain.on('dispararMensagens', (event, arg) => {
    if (arg && arg.mensagem && arg.to) {
      wpp.webContents.send('asynchronous-reply', { from: arg.to, msg: arg.mensagem, create: true });
    }
  });

  ipcMain.on('acessarChats', (event, arg) => {
    if (arg && arg.to) {
      wpp.webContents.send('open_chat', arg.to);
    }
  });

  ipcMain.on('fechar', (event, arg) => {
    if (!arg) { return; }

    if (arg.resetar) {
      session.defaultSession.clearStorageData().then(() => {
        if (arg.reiniciar) {
          app.relaunch();
        }

        app.quit();
      });

    } else {
      if (arg.reiniciar) {
        app.relaunch();
      }

      app.quit();
    }
  });
}

function checkAutoUpdater() {
  setTimeout(() => {
    if (!showVersionAvaliable) {
      autoUpdater.checkForUpdates();
    }
  }, (10000));

  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Nova versão disponível!',
      message: "",
      detail: 'Uma nova versão foi baixada, por favor feche o sistema para instalar a nova versão!'
    };

    dialog.showMessageBox(win, dialogOpts);
  });

  autoUpdater.on('error', (ev, message) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Erro na atualização',
      message: message,
      detail: 'Ocorreu um erro ao tentar atualizar.'
    };

    dialog.showMessageBox(win, dialogOpts);
  });

  autoUpdater.on('update-available', (args) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Atualização',
      message: "",
      detail: 'Uma nova versão será baixada.'
    };

    dialog.showMessageBox(win, dialogOpts, null);
  });

  autoUpdater.on('update-not-available', (args) => {
    if (showVersionAvaliable){
      const dialogOpts = {
        type: 'info',
        buttons: ['OK'],
        title: 'Versão já está atualizada',
        message: "",
        detail: 'Sua versão já está atualizada.'
      };

      dialog.showMessageBox(win, dialogOpts);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    win.setProgressBar(progressObj.percent / 100);
  })
}
