// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut, shell, ipcRenderer, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const FormData = require('form-data');
const Config = require('electron-config');
const fetch = require('electron-fetch').default;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Ha duas instancias abertas');
  app.quit();
  return;
}

const env = JSON.parse(fs.readFileSync(path.join(__dirname, './config.json'), 'utf8'));

const ENV_BS = env.BASE_SERVER;
const ENV_BS_HHH = env.BASE_SERVER_HHH;
const ENV_LG = env.BASE_LOGIN;
const ENV_LG_HHH = env.BASE_LOGIN_HHH;
const ENV_CDN = env.BASE_CDN;

const config = new Config();
let isHomolog = !!config.get('homologacao');

const base_login = isHomolog ? ENV_LG_HHH : ENV_LG;
let base_server = isHomolog ? ENV_BS_HHH : ENV_BS;
const loginPars = "?redirect=lebot";

let win = null;
let wpp = null;
let winLoad = null;

let dados = null;
let pauseWpp = false;
let quit = true;
let messagebox = false;
let loading = true;
let showVersionAvaliable = false;

app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36';
Menu.setApplicationMenu(createMenuContext());

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.setAppUserModelId('delivery.lecard.whatsapp');

function createWindow () {
  win = new BrowserWindow({
    width: 450,
    height: 480,
    resizable: false,
    title: 'LeBot',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png')
  });

  win.setMenu(null);

  win.loadURL(base_login + loginPars).then(() => {}).catch(() => {
    win.loadFile('pages/error.html');
    win.show();
  });

  win.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
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

  win.once('ready-to-show', () => {
    loading = false;
    winLoad.hide();
    win.show();
    loadDependences();
  });
}

function createBot(data) {
  wpp = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  wpp.loadURL("https://web.whatsapp.com/").then((res) => {
  });

  wpp.webContents.on('dom-ready', function(e) {
    setTimeout(() => {
      if (data.dados) {
        wpp.webContents.executeJavaScript('sessionStorage.setItem("nome_fantasia", "'+ data.dados.nome_fantasia +'");');

        if (data.dados.url_imagem) {
          wpp.webContents.executeJavaScript('sessionStorage.setItem("url_imagem", "'+ data.dados.url_imagem +'");');
        }
      }

      wpp.webContents.executeJavaScript('localStorage.getItem("pauseWpp");').then((res) => {
        if (res === '1') {
          pauseWpp = true;
          Menu.setApplicationMenu(createMenuContext());
        }
      });

      downloadApi();

    }, 2000);
  });

  wpp.on('close', () => {
    quit = true;
    win = null;
    wpp = null;
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

app.whenReady().then(() => {
  winLoad = new BrowserWindow({
    width: 450,
    height: 480,
    resizable: false,
    title: 'LeBot',
    backgroundColor: '#28A745',
    show: true,
    icon: path.join(__dirname, 'icon.png')
  });

  winLoad.setMenu(null);
  winLoad.loadFile("pages/loading.html");

  winLoad.once('ready-to-show', () => {
    createWindow();
  });

  winLoad.on('closed', () => {
    if (loading) {
      app.quit();
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });

  globalShortcut.register('CommandOrControl+B', () => {
    Menu.setApplicationMenu(createMenuContext(true));
  });
})

app.on('window-all-closed', function () {
  app.quit();
})

// Funcoes
function downloadApi() {
  try {
    fetch(ENV_CDN + 'api-2.js', { method: 'GET' })
      .then(res => res.text())
      .then(text => {
        if (text) {
          // const file = fs.readFileSync(__dirname + '/assets/api.js', "utf8");
          wpp.webContents.executeJavaScript(text);

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
      label: 'Opcões',
      submenu: [
        {
          label: pauseWpp ? 'Ativar o LeBot' : 'Pausar o LeBot',
          click: () => {
            desativarWpp();
            pauseWpp = !pauseWpp;
            Menu.setApplicationMenu(createMenuContext());
          }
        },
        {
          label: 'Configurações',
          click: () => {
            goPage('lebot');
          }
        },
        {
          label: 'Logout',
          click: () => {
            messagebox = dialog.showMessageBox(wpp, {
              type: 'warning',
              defaultId: 0,
              buttons: ['Não', 'Sim'],
              title: 'Fazer Logout',
              message: 'Deseja realmente sair?'
            }).then(res => {
              messagebox = false;

              if (res.response) {
                logoutApp();
              }
            });
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
          label: 'Verificar atualizações',
          enabled: true,
          click() {
            showVersionAvaliable = true;
            autoUpdater.checkForUpdates()
          },
        },
        {
          label: 'Resetar Sistema',
          click: () => {
            messagebox = dialog.showMessageBox(wpp, {
              type: 'warning',
              defaultId: 0,
              buttons: ['Não', 'Sim'],
              title: 'Resetar o sistema',
              message: 'Você precisará logar novamente no sistema e no WhatsApp. Deseja realmente resetar?'
            }).then(res => {
              messagebox = false;

              if (res.response) {
                logoutApp();
              }
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
          label: 'Visualizar Blocklist',
          click: () => {
            goPage('lebot');
          }
        }
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

            if (winLoad) {
              winLoad.webContents.openDevTools();
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

function desativarWpp() {
  if (wpp) {
    let script = pauseWpp ? 'localStorage.removeItem("pauseWpp", 1);' : 'localStorage.setItem("pauseWpp", 1);';
    wpp.webContents.executeJavaScript(script)
  }
}

function logoutApp() {
  session.defaultSession.clearStorageData().then(() => {
    app.quit();
  });
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
            })
          }
        }
      }).catch(err => console.log(err));
}

function sendMessage(event, from, msg, type, i) {
  setTimeout(() => {
    event.reply('asynchronous-reply', { from, msg, type })
  }, 2000 * (i + 1));
}

function goPage(page) {
  win.loadURL(base_login + page).then(() => {
    win.show();
    quit = false;
  });
}

function connectSocket() {
  if (!env.BASE_SOCKET) {
    return;
  }

  const io = require('socket.io-client');
  const socket = io(env.BASE_SOCKET);

  socket.on('connect', () => {
    if (dados.empresa) {
      console.log('empresa_connected', dados.empresa);
      socket.emit('empresa_connected', dados.empresa);
    }
  });

  socket.on('delivery_whatsapp', (data) => {
    sendSocketMessage(data);
  });

  socket.on('request_human', (data) => {
    showDialog(data);
  });
}

function sendSocketMessage(arg) {
  if (arg.to && arg.msg && Array.isArray(arg.msg) && wpp) {
    let i = 0;
    arg.msg.forEach(msg => {
      setTimeout(() => {
        wpp.webContents.send('asynchronous-reply', { msg, from: arg.to, origin: arg.origin })
      }, 1000 * i);
    });
  }
}

function showDialog(arg) {
  if (!wpp) {
    return;
  }

  wpp.flashFrame(true);

  const options = {
    type: 'warning',
    buttons: ['OK'],
    title: 'Solicitação de atendimento',
    message: (arg.telefone ? 'O cliente: ' + arg.telefone : 'Um cliente') + ' solicitou atendimento!',
  };

  dialog.showMessageBox(wpp, options, () => {
    wpp.flashFrame(false);
    wpp.show();
  });
}

// Eventos
ipcMain.on('reloadUrl', () => {
  win.loadURL(base_login + loginPars).then(() => {}).catch(() => {
    win.loadFile('pages/error.html');
  });
});

function loadDependences() {
  const isPackaged = app.isPackaged;

  ipcMain.on('login', (event, arg) => {
    if (arg && arg.token && !wpp) {
      dados = arg;
      win.hide();
      createBot(arg);
      connectSocket();
    }
  });

  ipcMain.on('go-page', (event, arg) => {
    goPage(arg);
  });

  ipcMain.on('asynchronous-message', (event, arg) => {
    sendToServer(event, arg)
  });

  ipcMain.on('focus', () => {
    if (wpp) {
      wpp.show()
    }
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
    wpp.setProgressBar(progressObj.percent / 100);
  })
}
