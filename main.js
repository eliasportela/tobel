// Modules to control application life and create native browser window
const {app, BrowserWindow, BrowserView, ipcMain, Menu, dialog, globalShortcut, shell, ipcRenderer, session } = require('electron');
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

let base_server = "";
let base_cdn = "";

let win = null;
let wpp = null;
let winLoad = null;

let dados = null;
let pauseWpp = !!config.get('pauseWpp');
let quit = true;
let messagebox = false;
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

  win.loadURL(base_login).then(() => {}).catch(() => {
    win.loadFile('pages/error.html');
  });

  win.once('ready-to-show', () => {
    setTimeout(() => {
      winLoad.close();
      win.show();
      win.focus();
    }, 2000);
  });

  win.on('close', function(e){
    if(!quit){
      e.preventDefault();
      quit = true;

      if (win) {
        win.hide();
      }
    }
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

  win.setBrowserView(wpp)
  wpp.setBounds({ x: 74, y: 0, width: 926, height: 572 })
  wpp.webContents.loadURL("https://web.whatsapp.com/");
  wpp.setAutoResize({width: true, height: true});

  wpp.webContents.on('dom-ready', function(e) {
    setTimeout(() => {
      if (data.dados) {
        wpp.webContents.executeJavaScript('sessionStorage.setItem("nome_fantasia", "'+ data.dados.nome_fantasia +'");');

        if (data.dados.url_imagem) {
          wpp.webContents.executeJavaScript('sessionStorage.setItem("url_imagem", "'+ data.dados.url_imagem +'");');
        }
      }

      toggleStatus();
      downloadApi();
      wpp.webContents.focus();
    }, 2000);
  });
}

function downloadApi() {
  try {
    fetch(base_cdn + '/lebot/api-3.js', { method: 'GET' })
      .then(res => res.text())
      .then(text => {
        if (text) {
          wpp.webContents.executeJavaScript(text);

          // const file = fs.readFileSync(__dirname + '/assets/api.js', "utf8");
          // wpp.webContents.executeJavaScript(file);

          const file2 = fs.readFileSync(__dirname + '/assets/whatsapp.js', "utf8");
          wpp.webContents.executeJavaScript(file2);

          const file3 = fs.readFileSync(__dirname + '/assets/custom.css', "utf8");
          wpp.webContents.insertCSS(file3);

        } else {
          showInjectError();
        }
      }).catch(err => {
        console.log('elias', err);
        showInjectError();
      }
    );
  } catch (error) {
    console.log('elias 2', error);
    showInjectError();
  }
}

function showInjectError() {
  messagebox = dialog.showMessageBox(wpp, {
    type: 'info',
    buttons: ['OK'],
    title: 'Erro ao iniciar',
    message: 'Não foi possível iniciar o LeBot. Por favor reinicie o sistema.'
  }, () => {
    messagebox = false;
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

  win.webContents.send('lebotStatus', { pauseWpp });
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
        if (json.success && json.msgs) {
          if (event) {
            let i = 0;
            let type = json.type || 'text';
            json.msgs.forEach(msg => {
              sendMessage(event, arg.from, msg, type, i++);
            });
          }
        }
      }).catch(err => console.log(err));
}

function sendMessage(event, from, msg, type, i) {
  setTimeout(() => {
    event.reply('asynchronous-reply', { from, msg, type })
  }, 2000 * (i + 1));
}

// Eventos
ipcMain.on('reloadUrl', () => {
  win.loadURL(base_login).then(() => {}).catch(() => {
    win.loadFile('pages/error.html');
  });
});

function loadDependences() {
  const isPackaged = app.isPackaged;

  ipcMain.on('login', (event, arg) => {
    if (arg && arg.token) {
      base_server = arg.base_server;
      base_cdn = arg.base_cdn;
      dados = arg;

      if (!wpp) {
        createBot(arg);
      }

      console.log(base_server);
    }
  });

  ipcMain.on('toggleBot', (event, arg) => {
    let bot = !!win.getBrowserView();

    if (arg !== bot) {
      if (arg) {
        win.setBrowserView(wpp)

      } else {
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
      const dados = {
        from: arg.from,
        text: arg.text,
        blocklist: true,
        isMe: true
      };
      sendToServer(event, dados);
    }
  });

  ipcMain.on('contact', (event, arg) => {
    if (!pauseWpp && arg && arg.from) {
      const url = base_server + "api/chatbot/contato/"+ dados.token +"?id=" + arg.from;
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
      wpp.webContents.send('asynchronous-reply', { msg: arg.mensagem, from: arg.to });
    }
  });

  ipcMain.on('acessarChats', (event, arg) => {
    if (arg && arg.to) {
      wpp.webContents.send('open_chat', arg);
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

  if (isPackaged) {
    checkAutoUpdater();
  }
}

function checkAutoUpdater() {
  setTimeout(() => {
    if (!showVersionAvaliable) {
      autoUpdater.checkForUpdates();
    }
  }, (30000));

  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Nova versão disponível!',
      message: "",
      detail: 'Uma nova versão foi baixada, por favor feche o sistema para instalar a nova versão!'
    };

    dialog.showMessageBox(win, dialogOpts, null);
  });

  autoUpdater.on('error', (ev, message) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Erro na atualização',
      message: message,
      detail: 'Ocorreu um erro ao tentar atualizar.'
    };

    dialog.showMessageBox(win, dialogOpts, null);
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

      dialog.showMessageBox(win, dialogOpts, null);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    win.setProgressBar(progressObj.percent / 100);
  })
}
