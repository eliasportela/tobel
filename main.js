// Modules to control application life and create native browser window
const {app, BrowserWindow, BrowserView, ipcMain, Menu, dialog, globalShortcut, powerSaveBlocker} = require('electron');
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

const config = new Config();
const isHomolog = config.get('IS_HOMOLOG');
// const base_login = isHomolog ? 'https://hhh.lebot-web.lecard.delivery/' : 'https://lebot-web.lecard.delivery/';
const base_login = 'http://localhost:8080/';

let base_server = null;
let api_url = null;
let api_lebot = 1;

let win = null;
let wpps = [];
let winLoad = null;
let empresas = [];

let version = app.getVersion();
let pauseWpp = !!config.get('pauseWpp');
let showVersionMenu = false;
let idPowerSave = null;

app.userAgentFallback = `Lebot/${version} (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36`;
Menu.setApplicationMenu(createMenuContext());

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('disable-features', 'LeakyPeeker')
app.setAppUserModelId('delivery.lecard.whatsapp');

app.whenReady().then(() => {
  createWindow();

  winLoad = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, './build/icon.ico')
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
  if (idPowerSave) {
    powerSaveBlocker.stop(idPowerSave)
  }

  app.quit();
})

// Funcoes
function createWindow() {
  win = new BrowserWindow({
    title: 'LeBot',
    width: 1000,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#1CC88A',
    show: false,
    icon: path.join(__dirname, './build/icon.ico'),
    webPreferences: {
      backgroundThrottling: false,
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
    win.webContents.executeJavaScript(`window.ElectronV='${version}'; localStorage.setItem('ElectronV', '${version}');`);

    setTimeout(() => {
      winLoad.close();
      win.maximize();
      win.show();
      win.focus();
    }, 2000);
  });

  win.on('closed', () => {
    app.quit()
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function createBot(empresa) {
  const wpp = new BrowserView({
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      webSecurity: false,
      preload: path.join(__dirname, 'wpp-preload.js'),
      partition: `persist:whatsapp${empresa.id_empresa}`
    }
  });

  await wpp.webContents.loadURL("https://web.whatsapp.com/");
  await wpp.webContents.executeJavaScript(`const LEBOT=${api_lebot};`);
  wpp.webContents.send('set_empresa', empresa);
  wpp.setAutoResize({ width: true, height: true });

  setTimeout(() => {
    toggleStatus(wpp);
    downloadApi(wpp);
  }, 2000);

  wpp.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  return wpp;
}

function downloadApi(wpp) {
  if (!api_url) {
    try {
      const file = fs.readFileSync(__dirname + '/assets/api.js', "utf8");
      injectScript(wpp, file);

    } catch (error) {
      console.log('api lebot file error', error);
      showInjectError();
    }

  } else {
    try {
      fetch(api_url, { method: 'GET' })
          .then(res => res.text())
          .then(text => {
            if (text) {
              injectScript(wpp, text);

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

async function injectScript(wpp, text) {
  await wpp.webContents.executeJavaScript(text);

  const file2 = fs.readFileSync(__dirname + '/assets/whatsapp.js', "utf8");
  await wpp.webContents.executeJavaScript(file2);

  const file3 = fs.readFileSync(__dirname + '/assets/custom.css', "utf8");
  await wpp.webContents.insertCSS(file3);
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
      label: 'Configs',
      submenu: [
        {
          label: (isHomolog ? 'Modo produção' : 'Modo de teste'),
          enabled: true,
          click() {
            const dialogOpts = {
              type: 'info',
              buttons: ['Cancelar', 'Sim'],
              title: 'Alternar sistema',
              message: "",
              detail: 'Deseja alterar este sistema para ' + (isHomolog ? 'produção?' : 'o modo de teste?')
            };

            dialog.showMessageBox(win, dialogOpts, null).then((returnValue) => {
              if (returnValue.response !== 0) {
                if (isHomolog) {
                  config.delete('IS_HOMOLOG');

                } else {
                  config.set('IS_HOMOLOG', 'true');
                }

                app.relaunch();
                app.quit();
              }
            });
          },
        },
        {
          label: (win && win.isFullScreen() ? "Sair" : "Modo") + " FullScrean",
          enabled: true,
          click() {
            if (win) {
              win.setFullScreen(!win.isFullScreen());
              Menu.setApplicationMenu(createMenuContext());
            }
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
            showVersionMenu = true;
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
              message: 'LeBot - LeCard\nStatus: Ativo\nVersão: ' + version
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

            wpps.forEach(wpp => {
                wpp.webContents.openDevTools();
            });
          }
        }
      ]
    })
  }

  return Menu.buildFromTemplate(menus);
}

function toggleStatus(wpp) {
  if (wpps && wpps.length) {
    const code = pauseWpp ? 'localStorage.setItem("pauseWpp", 1);' : 'localStorage.removeItem("pauseWpp", 1);';

    wpps.forEach(wpp => {
      wpp.webContents.executeJavaScript(code);
    });

    if (pauseWpp) {
      config.set('pauseWpp', 'true');

    } else {
      config.delete('pauseWpp');
    }
  }

  win.webContents.send('lebotStatus', { pauseWpp, version });
}

function sendToServer(event, arg) {
  const form = new FormData();
  const token = arg.token;
  form.append('text', arg.text);
  form.append('user_id', arg.from);
  form.append('isMe', arg.isMe.toString());
  form.append('isAudio', arg.isAudio ? 'true' : 'false');
  form.append('location', arg.location ? JSON.stringify(arg.location) : '');
  form.append('botNumber', arg.botNumber ? arg.botNumber : '');
  form.append('readOnly', arg.readOnly ? 'true' : 'false');

  if (!arg.isMe) {
    if (arg.contact) {
      form.append('contact', arg.contact);
    }

    if (arg.number) {
      form.append('number', arg.number);
    }
  }

  fetch(base_server + "api/chatbot/" + token, { method: 'POST', body: form })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.msgs && event) {
          const msgs = json.msgs.map(msg => { return { content: msg } });
          event.reply('asynchronous-reply', { from: arg.from, msgs });
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
  ipcMain.on('login', async (event, arg) => {
    if (!arg || !arg.empresas) {
      return;
    }

    empresas = arg.empresas;
    api_url = arg.api_url || null;
    api_lebot = api_url ? (arg.api_lebot || 1) : 1;
    base_server = arg.base_server || null;

    if (!wpps.length && base_server) {
      for (let i=0; i < empresas.length; i++) {
        empresas[i].wpp = (i + 1);
        const wpp = await createBot(empresas[i]);

        if (wpp) {
          wpps.push(wpp);

          if (empresas[i].isDefault) {
            win.setBrowserView(wpp);
            const bounds = win.getContentBounds();
            wpp.setBounds({ x: 74, y: 30, width: (bounds.width - 70), height: (bounds.height - 30) });
          }
        }
      }
    }

    if (!idPowerSave) {
      idPowerSave = powerSaveBlocker.start('prevent-display-sleep');
    }
  });

  ipcMain.on('toggleBot', (event, arg) => {
    let bot = win.getBrowserView();

    if (arg && arg.wpp && arg.bot !== !!bot) {
      const wpp = wpps[arg.wpp - 1];

      if (arg.bot) {
        win.setBrowserView(wpp);
        const bounds = win.getContentBounds();
        wpp.setBounds({ x: 74, y: 30, width: (bounds.width - 70), height: (bounds.height - 30) });

      } else {
        win.removeBrowserView(bot);
      }
    }
  });

  ipcMain.on('toggleWpp', (event, arg) => {
    if (arg && arg.wpp && arg.wpp <= wpps.length) {
      const wpp = wpps[arg.wpp - 1];
      win.setBrowserView(wpp);
      const bounds = win.getContentBounds();
      wpp.setBounds({ x: 74, y: 30, width: (bounds.width - 70), height: (bounds.height - 30) });
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
    if (arg && arg.token && arg.from && arg.text) {
      sendToServer(event, { token: arg.token, from: arg.from, text: arg.text, isMe: true });
    }
  });

  ipcMain.on('contact', (event, arg) => {
    if (arg && arg.id_empresa && arg.from) {
      const url = base_server + "api/chatbot/contato/"+ arg.token +"?id=" + arg.from + "&id_empresa=" + arg.id_empresa;
      fetch(url, { method: 'GET' })
          .then(res => res.json())
          .then(json => {
            if (event) {
              event.reply('fill-contact', json)
            }
          }).catch(err => console.log(err));
    }
  });

  ipcMain.on('bot-number', (event, arg) => {
    if (arg.phone) {
      console.log('Wpp Session', arg.phone);
      win.webContents.send('wppSession', arg);
    }
  });

  ipcMain.on('dispararMensagens', (event, arg) => {
    if (arg && arg.mensagens && arg.to && arg.wpp) {
      wpps[arg.wpp - 1].webContents.send('asynchronous-reply', { from: arg.to, msgs: arg.mensagens, trigger: true });
    }
  });

  ipcMain.on('acessarChats', (event, arg) => {
    if (arg && arg.to && arg.wpp && arg.wpp <= wpps.length) {
      wpps[arg.wpp - 1].webContents.send('open_chat', arg.to);
    }
  });

  ipcMain.on('markUnread', (event, arg) => {
    if (arg && arg.phone && arg.wpp && arg.wpp <= wpps.length) {
      wpps[arg.wpp - 1].webContents.send('mark_unread', arg.phone);
    }
  });

  ipcMain.on('fechar', async (event, arg) => {
    if (!arg) {
      return;
    }

    if (arg.resetar) {
      if (arg.wpp) {
        const wpp = arg.wpp <= wpps.length ? wpps[arg.wpp - 1] : null;

        if (wpp) {
          await wpp.webContents.session.clearCache();
          await wpp.webContents.session.clearStorageData();
        }

      } else {
        const { webContents } = require('electron');

        for (const wpp of webContents.getAllWebContents()) {
          await wpp.session.clearCache();
          await wpp.session.clearStorageData();
        }
      }
    }

    if (arg.reiniciar) {
      app.relaunch();
    }

    app.quit();
  });

  ipcMain.on('update', (event, option) => {
    if (app.isPackaged) {
      showVersionMenu = false;
      autoUpdater.checkForUpdates();

    } else {
      dialog.showMessageBox(win, {
        type: 'info',
        buttons: ['OK'],
        title: 'Atualização',
        message: "Nova versão disponível",
        detail: 'Por favor não feche o sistema, aguarde estamos baixando a nova versão.'
      }, null);
    }
  });
}

function checkAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    win.webContents.send('updateReply', {
      title: 'Atualização',
      message: 'Verificando atualização',
      detail: 'Só um momento, estamos aguardando a nova versão.',
      step: 1
    });
  });

  autoUpdater.on('update-available', () => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Atualização',
      message: 'Baixando atualização',
      detail: 'Por favor não feche o sistema, estamos baixando a nova versão.'
    };

    if (showVersionMenu) {
      dialog.showMessageBox(win, dialogOpts, null);

    } else {
      dialogOpts.step = 2;
      win.webContents.send('updateReply', dialogOpts);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Reiniciar'],
      title: 'Atualização',
      message: "Versão baixada com sucesso!",
      detail: 'Clique em "Reiniciar" ou feche e abra novamente o sistema.'
    };

    dialog.showMessageBox(win, dialogOpts, null).then(() => {
      autoUpdater.quitAndInstall();
    });

    dialogOpts.step = 3;
    win.webContents.send('updateReply', dialogOpts);
  });

  autoUpdater.on('error', (ev, message) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Atualização',
      message: 'Erro ao tentar atualizar',
      detail: message
    };

    if (showVersionMenu) {
      dialog.showMessageBox(win, dialogOpts, null);

    } else {
      dialogOpts.step = 4;
      win.webContents.send('updateReply', dialogOpts);
    }
  });

  autoUpdater.on('update-not-available', (args) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Atualização',
      message: 'Tudo certo por aqui!',
      detail: 'Você já está usando a versão atual do sistema.'
    };

    if (showVersionMenu) {
      dialog.showMessageBox(win, dialogOpts, null);

    } else {
      dialogOpts.step = 5;
      win.webContents.send('updateReply', dialogOpts);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    win.setProgressBar(progressObj.percent / 100);
    win.webContents.send('updateProgress', progressObj.percent);
  });
}