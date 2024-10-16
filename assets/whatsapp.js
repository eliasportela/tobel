const lebot = (typeof LEBOT !== undefined) ? LEBOT : 1;

let API_LEBOT = null;
let senderId = null;
let botNumber = null;
let main_ready = false;
const messageTimeouts = new Map();
const analytics = [];
let intervalButton = null;

document.addEventListener('send-message', function (e) {
  if (API_LEBOT) {
    sendMessage(e.detail.from, e.detail.msgs, e.detail.trigger)
  }
}, false);

document.addEventListener('fill-contact', function (e) {
  if (API_LEBOT) {
    fillContact(e.detail);
  }
}, false);

document.addEventListener('open-chat', async function (e) {
  if (API_LEBOT) {
    openChat(e.detail);
  }
}, false);

document.addEventListener('mark-unread', async function (e) {
  if (API_LEBOT) {
    markUnread(e.detail)
  }
}, false);

const intervalTry = setInterval(() => {
  if (lebot === 2) {
    startWppConnect();

  } else {
    startLeBot();
  }
}, 3000);

function startLeBot() {
  if (window.API.listener !== undefined) {
    clearInterval(intervalTry);
    clearInterval(intervalButton);

    if (!main_ready) {
      console.log("LEBOT INICIADO");
      API_LEBOT = window.API;

      configurarEmpresa(1);

      intervalButton = setInterval(() => {
        novoChat();
      },1000);

      API_LEBOT.listener.ExternalHandlers.MESSAGE_RECEIVED.push(function (sender, chat, msg) {
        novaMensagem(msg, chat);
      });
    }
  }
}

function startWppConnect() {
  if (typeof window.WPP !== "undefined") {
    clearInterval(intervalTry);
    console.log("WPP INICIADO");
    API_LEBOT = window.WPP;

    API_LEBOT.on('conn.main_ready', () => {
      if (!main_ready) {
        main_ready = true;
        configurarEmpresa(2);
      }
    });

    API_LEBOT.on('chat.new_message', (msg) => {
      novaMensagem(msg, null);
    });

    API_LEBOT.on('chat.active_chat', (chat) => {
      if (!chat) {
        return;
      }

      novoChat(chat);
    });

  } else {
    console.log("not listener yet")
  }
}

function configurarEmpresa(api) {
  console.log("checking phone");

  if (api === 1) {
    const intervalCheckReady = setInterval(() => {
      if (window.localStorage['last-wid'] || window.localStorage['last-wid-md']) {

        let phone = (window.localStorage['last-wid'] || window.localStorage['last-wid-md'] ).replace(/"/g, "").split('@')[0]
        botNumber = phone.split(':')[0]

        if (botNumber) {
          clearInterval(intervalCheckReady);
          console.log("phone: " + botNumber);
          document.dispatchEvent(new CustomEvent('bot_number', { detail: botNumber }));
        }
      }
    }, 5000);

  } else if (api === 2) {
    const id = API_LEBOT.conn.getMyUserId();

    if (id) {
      botNumber = id && id.user ? id.user : null;

      if (botNumber) {
        console.log("phone: " + botNumber);
        document.dispatchEvent(new CustomEvent('bot_number', { detail: botNumber }));
      }
    }
  }
}

function novaMensagem(msg, chat) {
  chat = chat ? chat : (msg.chat && msg.chat.id ? msg.chat.id : {});
  const isMe = msg.id && msg.id.fromMe;
  const isAudio = (msg.type === 'ptt');
  const text = isAudio ? '-' : (msg.body || null);
  const isGroupMsg = (msg.isGroupMsg || msg.__x_isGroupMsg);

  if (chat.server !== 'c.us' || isGroupMsg || !["ptt", "chat"].includes(msg.type) || !text || (isMe && isAudio) || msg.ack !== 1) {
    return;
  }

  const clearmessage = text.trim().toLowerCase();

  if ((!isMe || clearmessage.startsWith("lebot")) && !clearmessage.startsWith("#")) {
    const from = chat._serialized;
    const detail = { isMe, from, botNumber, isAudio, text };

    if (isMe) {
      detail.from = (msg.to || {})._serialized;

      if (!detail.from) {
        return;
      }

    } else if (msg.senderObj) {
      detail.contact = msg.senderObj.pushname || '';
      detail.number = msg.senderObj.userid || '';
    }

    if (localStorage.getItem('pauseWpp') === '1') {
      if (analytics.includes(from)) {
        return;
      }

      console.log('readOnly', from);
      analytics.push(from);
      detail.readOnly = true;
    }

    setFilaMensagem(from, detail, msg.t);
  }
}

function novoChat(chat) {
  const footer = document.getElementsByTagName("footer")[0];

  if (footer !== undefined && footer.dataset.appliend === undefined) {
    footer.dataset.appliend = 'true';

    if (!chat) {
      chat = API_LEBOT.getActiveTab();
    }

    senderId = null;
    const div = (footer.getElementsByTagName('div')[0]);

    if (div !== undefined && chat) {
      senderId = chat.id._serialized;

      if (!chat.isGroup && senderId) {
        document.dispatchEvent(new CustomEvent('contact', { detail: {from: senderId} }))
        div.insertBefore(makeSmartOptions(senderId), div.children[2]);
      }
    }
  }
}

function setFilaMensagem(chatId, mensagem, time) {
  if (messageTimeouts.has(chatId)) {
    clearTimeout(messageTimeouts.get(chatId));
  }

  messageTimeouts.set(chatId, setTimeout(() => {
    if (!hasExpired(time)) {
      console.log(mensagem);
      document.dispatchEvent(new CustomEvent('message_received', { detail: mensagem }));
    }
    messageTimeouts.delete(chatId);
  }, 4000));
}

async function sendMessage(senderId, arrayMessage, trigger) {
  if (lebot === 2) {
    for (const message of arrayMessage) {
      if (message.type === 'image') {
        API_LEBOT.chat.sendFileMessage(senderId, `data:${message.content.contentType};base64,${message.content.base64Img}`, {
          type: 'image', caption: message.caption
        });

      } else if (message.content && typeof message.content === 'string') {
        await new Promise(resolve => setTimeout(resolve, 900));
        API_LEBOT.chat.sendTextMessage(senderId, message.content, {
          createChat: (trigger || false)
        });
      }
    }

  } else {
    API_LEBOT.mainSendMessage({senderId, arrayMessage});
  }
}

function hasExpired(time) {
  return !time || (time + (60 * 15)) < (new Date().getTime() / 1000);
}

// @implementing
const messageBufferPerChatId = new Map();

function validarFilaMensagem(chatId, mensagem) {
  messageBufferPerChatId.set(chatId, mensagem);

  if (messageTimeouts.has(chatId)) {
    clearTimeout(messageTimeouts.get(chatId));
  }

  messageTimeouts.set(chatId, setTimeout(() => {
    const detail = messageBufferPerChatId.get(chatId);
    document.dispatchEvent(new CustomEvent('message_received', { detail }));
    messageBufferPerChatId.delete(chatId);
    messageTimeouts.delete(chatId);
  }, 4000));
}

// @imports
let checkAdmin = null;
let buttonOptions = null;
let btnLoading = null;
let buttonStop = null;
let buttonPlay = null;
let buttonPause = null;
let buttonRestart = null;
let buttonMenu = null;

function makeSmartOptions(senderId, dev) {
  const newDiv = document.createElement('div');

  newDiv.innerHTML = mountMyButton();
  newDiv.style.width = "45px";
  newDiv.style.height = "50px";

  btnLoading = newDiv.querySelector("#loading");
  checkAdmin = newDiv.querySelector("#checkAdmin");
  buttonOptions = newDiv.querySelector("#buttonOptions");

  buttonPause = newDiv.querySelector("#pause");
  buttonPause.addEventListener("click", () => {
    enviarComando(senderId, "lebot ok");
    buttonPause.classList.add("hide");
    buttonPlay.classList.remove("hide");
    buttonStop.classList.remove("hide");
    buttonRestart.classList.remove("hide");
    buttonOptions.classList.add('paused');
  });

  buttonStop = newDiv.querySelector("#stop");
  buttonStop.addEventListener("click", () => {
    enviarComando(senderId, "lebot add");
    buttonPlay.classList.remove("hide");
    buttonPause.classList.add("hide");
    buttonStop.classList.add("hide");
    buttonRestart.classList.add("hide");
    buttonOptions.classList.add('paused');
  });

  buttonPlay = newDiv.querySelector("#play");
  buttonPlay.addEventListener("click", () => {
    enviarComando(senderId, "lebot remover");
    buttonPlay.classList.add("hide");
    buttonPause.classList.remove("hide");
    buttonStop.classList.remove("hide");
    buttonRestart.classList.remove("hide");
    buttonOptions.classList.remove('paused');
  });

  buttonRestart = newDiv.querySelector("#restart");
  buttonRestart.addEventListener("click", () => {
    enviarComando(senderId, "lebot iniciar");
    buttonPlay.classList.add("hide");
    buttonPause.classList.remove("hide");
    buttonStop.classList.remove("hide");
    buttonRestart.classList.remove("hide");
    buttonOptions.classList.remove('paused');
  });

  buttonMenu = newDiv.querySelector("#menu");
  buttonMenu.addEventListener("click", () => {
    enviarComando(senderId, "lebot menu");
  });

  if (dev) {
    buttonStop.classList.remove("hide");
    buttonPause.classList.remove("hide");
    buttonRestart.classList.remove("hide");
    btnLoading.classList.add("hide");
  }

  return newDiv;
}

function mountMyButton() {
  const imgBot = '<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF"><path d="M249 .9c-7.1 2.3-13.1 7.4-16.6 14.1-2.7 5.2-2.6 17.2.3 22.6 2.7 5.1 8.9 10.8 13.7 12.5l3.6 1.3V73h-5c-16.5 0-44.3 5.1-65.5 12.1C107.3 108.8 54.4 166 43 232.6c-2.8 16.2-2.8 39.5-.1 55.5 10.9 63.4 57 116.6 124.7 143.8 5.2 2.1 9.7 4.1 10.1 4.4.6.7-11.2 16.6-18.6 25-9.4 10.8-11.9 19.2-8.6 30.2 1.3 4.6 2.8 6.9 7.3 11.4 9.4 9.3 17.7 10.4 36 4.6 34.9-11.1 65.4-29 91.9-53.9l8.2-7.7 12.1-2.5c31.3-6.3 62.7-20.1 89-39 9.8-6.9 28.5-24.6 36.3-34.2 20.4-25 33.3-53.4 38.2-84.5 2.3-14.1 2.1-38.2-.4-52.8-9.9-57.9-50.7-108.8-109.9-137.2-13.9-6.6-36.8-14.5-51.5-17.6-11.1-2.4-32.5-5.1-40.4-5.1H262V51.4l3.6-1.3c4.8-1.7 11-7.4 13.7-12.5 2.9-5.4 3-17.4.3-22.6-2.6-4.9-7.4-9.8-12.1-12.2C263.2.6 253.1-.5 249 .9M283.3 111c22.8 3.9 46.1 13.5 64.7 26.7 12.1 8.7 27.6 24.2 36.3 36.3 12.8 18.1 23.2 42.1 27.7 64 4.1 19.9 4.3 49.8.5 64.5-2.7 10.5-9.1 21.9-17.3 30.6-16.4 17.4-36.6 25-61.3 22.8-12.1-1-18.9-3.4-36.4-12.4-17.3-8.8-24.3-10.7-41-10.8-16.9-.1-24.5 1.9-42.1 10.9-17.4 9-24.3 11.3-36.3 12.3-24.4 2.1-44.8-5.3-60.8-22.3-13-13.7-18.7-27.3-20.2-48.4-2.2-31.7 3.5-60.7 17.4-88.7 8.3-16.6 17.4-29.3 30-42 22.6-22.6 52-37.9 83.2-43.4 15.3-2.7 40.2-2.8 55.6-.1m-18.7 249.9c9.8 6 12.2 18.6 5.2 26.7-4.1 4.7-8.2 6.6-13.8 6.6-15.2 0-23.7-18.1-13.7-29.1 5.8-6.3 15.8-8.2 22.3-4.2"/><path d="M178.4 168.8c-5.6 2.7-11 8.5-12.8 14-2.2 6.3-2.3 37.1-.1 43.1 6.3 18.1 29.8 22.2 41.2 7.3 4.9-6.4 5.5-10.2 5.1-31.2l-.3-18.7-3-4.9c-4.4-7-10.9-10.8-19.4-11.2-4.9-.2-7.7.2-10.7 1.6m134.8.8c-5.7 2.8-9.7 7.3-11.8 13.1-1.6 4.6-1.9 36.9-.4 42.5.6 2.1 2.5 5.6 4.3 8 11.5 15 35.1 10.7 41.3-7.6 2.4-6.9 1.6-39.7-1-44.9-6.1-12.3-20.3-17.2-32.4-11.1M221.6 239c-7.8 3.9-12.2 10.2-13.3 18.9-1.2 10.2 4.4 19.4 16.5 27.4 21.6 14.4 49.5 12.5 68.8-4.6 11.9-10.7 13.8-25 4.7-35.6-8.9-10.4-23.6-10.9-35.7-1.2-5.1 4.1-8.3 4-13.7-.5-2.3-1.9-5.8-4.2-7.7-5-5-2-14.8-1.7-19.6.6M30 185.4c-7.6 5.6-15.7 15.2-19.4 22.9-6.9 14.7-8.8 30.2-9 71.2-.1 32.1.5 36.6 6.5 49.3 6.2 13 21.7 25.8 35.1 29.2 4.1 1.1 5.1 1 7.3-.4 1.4-.9 2.5-2.6 2.5-3.9 0-1.2-2.4-7.1-5.4-13.2-13-26.5-18.6-50.6-18.6-80 0-23.7 3.1-41 11.2-62.8 3.8-10.2 3.9-10.8 2.4-13.2-2.4-3.6-7-3.3-12.6.9m439.4-.9c-1.5 2.4-1.4 3 2.4 13.2 8.1 21.8 11.2 39 11.2 62.8 0 29.5-5.6 53.5-18.6 80-3 6.1-5.4 12-5.4 13.2 0 1.3 1.1 3 2.5 3.9 2.2 1.4 3.2 1.5 7.3.4 13.4-3.4 28.9-16.2 35.1-29.2 6-12.7 6.6-17.2 6.5-49.3-.2-52.3-3.9-69.4-18.6-85.1-11.3-12-18.8-15.3-22.4-9.9"/></svg>';
  const imgPause = '<svg enable-background="new 0 0 39.989 39.989" version="1.1" viewBox="0 0 39.989 39.989" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" fill="#F6C23E"><path d="M19.995,0C8.952,0,0,8.952,0,19.994c0,11.043,8.952,19.995,19.995,19.995s19.995-8.952,19.995-19.995  C39.989,8.952,31.037,0,19.995,0z M18.328,26.057c0,0.829-0.671,1.5-1.5,1.5s-1.5-0.671-1.5-1.5V14.724c0-0.829,0.671-1.5,1.5-1.5  s1.5,0.671,1.5,1.5V26.057z M24.661,26.057c0,0.829-0.671,1.5-1.5,1.5s-1.5-0.671-1.5-1.5V14.724c0-0.829,0.671-1.5,1.5-1.5  s1.5,0.671,1.5,1.5V26.057z"/></svg>';
  const imgPlay = '<svg viewBox="0 0 496 496" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M496 248c0 136.8-111.2 248-248 248S0 384.8 0 248 111.2 0 248 0s248 111.2 248 248" fill="#2E7BFC"/><path d="M212.8 360.8c-1.6 0-4-.8-5.6-1.6-4-1.6-7.2-6.4-7.2-10.4V199.2c0-4 3.2-8.8 7.2-10.4s8.8-1.6 12.8.8l101.6 75.2q4.8 3.6 4.8 9.6c0 6-1.6 7.2-4.8 9.6L220 359.2c-2.4.8-4.8 1.6-7.2 1.6" fill="#4762b4"/><path d="M212.8 334.4c-1.6 0-4-.8-5.6-1.6-4-1.6-7.2-6.4-7.2-10.4V172.8c0-4 3.2-8.8 7.2-10.4s8.8-1.6 12.8.8l101.6 75.2q4.8 3.6 4.8 9.6c0 6-1.6 7.2-4.8 9.6L220 332.8c-2.4.8-4.8 1.6-7.2 1.6" fill="#fff"/></svg>';
  const imgStop = '<svg viewBox="0 0 496 496" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M496 248c0 136.8-111.2 248-248 248S0 384.8 0 248 111.2 0 248 0s248 111.2 248 248" fill="#F73974"/><path d="M320 206.4c0-16.8-13.6-30.4-30.4-30.4h-83.2c-16.8 0-30.4 13.6-30.4 30.4v84c0 16.8 13.6 30.4 30.4 30.4h84c16.8 0 30.4-13.6 30.4-30.4v-84z" fill="#fff"/></svg>'
  const imgRestart = '<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#1BA698"><path d="M237.4 1C160.5 7 91.1 46.8 46.6 110.4 24.4 142.1 9.5 179.6 3.5 219 1 235.3.4 266.6 2.4 283.5c5.6 47.7 21.9 88.6 50.7 127.2 10.3 13.7 35.8 39.1 49.9 49.5 37.1 27.4 76.1 43.4 121.1 49.4 15 2 46.9 2.3 61.4.5 46.2-5.7 86.6-21.9 124.5-49.9 14.1-10.4 39.6-35.8 49.9-49.5 26.8-35.9 42.9-74.3 49.8-118.7 2.5-16.2 2.5-55.8 0-72-2.2-14.3-6.6-32.5-10.7-45C468 82.7 385.8 15 289.9 2.6 274.9.7 251.2-.1 237.4 1m-70.9 135.9c7.6 3.5 10.4 9.1 10.5 21.3v7.7l7.4-5.3c20-14.4 43.1-21.6 68.8-21.6 59.5 0 109.2 43 117.9 102 1.8 12.9.7 34.2-2.6 46.5-3 11.4-10.2 27.2-17.2 37.8-12.8 19.2-36.5 37.2-59.3 45-43.3 14.7-90.7 3.8-122.9-28.4-14.4-14.5-28.1-37.7-28.1-48 0-10.9 11.4-18.7 21.7-14.8 4.7 1.7 7.4 5 11.5 13.8 19.7 42.6 67.2 61.8 110.8 45 32.5-12.5 54.2-44.8 54.2-80.4 0-22.7-7.5-41.9-22.8-58.3-11.5-12.5-25.5-20.9-41.9-25.3-11.7-3.1-30.8-3.2-42.5-.1-10.3 2.8-22.6 8.6-30 14.3-5.4 4-5.4 4.1-2.1 3.5 9.9-1.8 21.1-2.8 24.6-2.2 8 1.5 14 11.5 11.7 19.5-1.5 5-4.3 8.5-8.4 10.4-1.9.9-17.7 3.9-35.2 6.6-25.7 4.1-32.5 4.9-35.5 4.1-4-1-9.4-6-10.9-10-.5-1.4-1.3-18.1-1.7-37.1l-.7-34.7 2.3-4.1c4.5-8 12.5-10.9 20.4-7.2"/></svg>'
  const imgMenu = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080"><path fill="#7F66FF" d="M324.751 1022.327c-27.033-12.798-53.26-26.331-77.433-43.37-15.262-10.758-30.381-21.86-44.547-33.995-16.469-14.108-32.767-28.65-47.41-44.594-15.848-17.256-30.147-36.008-44.315-54.719-18.362-24.25-33.245-50.702-46.193-78.2-13.671-29.035-25.381-58.838-32.832-90.131-4.309-18.1-8.526-36.253-11.777-54.56-2.293-12.91-3.218-26.098-4.162-39.203-1.045-14.515-2.257-29.1-1.88-43.614.534-20.603 1.468-41.293 4.044-61.717a683 683 0 0 1 11.997-67.564c6.23-27.084 15.699-53.236 26.748-78.79 13.903-32.154 30.512-62.815 50.923-91.275 10.887-15.18 22.31-30.054 34.486-44.21 12.102-14.07 24.728-27.86 38.436-40.332 16.635-15.132 34.244-29.279 52.152-42.905 26.574-20.22 55.682-36.386 85.888-50.533 26.098-12.224 52.897-22.625 80.904-29.628 16.623-4.156 33.257-8.345 50.045-11.73 10.745-2.166 21.806-2.716 32.68-4.297 27.714-4.03 55.605-3.222 83.435-2.77 14.1.228 28.167 2.434 42.25 3.741 23.368 2.168 46.185 7.29 68.85 13.107 23.93 6.141 47.325 13.991 69.9 24.035 15.257 6.788 30.369 13.962 45.199 21.634 23.46 12.137 45.444 26.704 66.556 42.545 23.186 17.396 44.65 36.757 64.719 57.667 17.237 17.96 32.914 37.205 47.446 57.408 17.56 24.412 32.912 50.15 45.937 77.23 14.2 29.526 25.922 60.043 34.072 91.8 3.974 15.485 7.133 31.203 10.047 46.93 2.475 13.354 4.134 26.863 6.013 40.324a111 111 0 0 1 1.027 12.807c.42 18.935 1.47 37.9.816 56.803-.596 17.221-2.89 34.4-4.8 51.556-3.23 29.003-9.22 57.5-18.606 85.1-7.356 21.63-15.685 42.97-24.484 64.063-12.032 28.841-28.077 55.587-46.048 81.06-10.675 15.133-22.256 29.702-34.341 43.74-11.674 13.562-23.82 26.881-37.023 38.92-16.626 15.158-34.186 29.36-51.98 43.152-22.191 17.2-46.314 31.616-71.473 43.942-19.798 9.7-40.328 18.01-60.885 26.037-27.77 10.842-56.81 17.388-86.012 23.003-10.77 2.07-21.817 2.664-32.69 4.25-27.049 3.943-54.272 3.269-81.435 2.77-14.768-.27-29.504-2.408-44.25-3.759-23.37-2.14-46.19-7.266-68.846-13.107-23.92-6.168-47.253-14.138-69.944-23.945-3.6-1.556-7.26-2.972-11.204-4.676m376.83-574.19c8.16-.92 14.507-5.532 19.71-11.19 7.96-8.658 11.214-19.204 9.74-31.098-1.167-9.406-5.585-17.128-12.312-23.424-8.928-8.355-20.252-10.373-31.93-10.383-91.285-.076-182.569-.071-273.853.002-9.43.007-18.88.356-28.286 1.035-9.077.656-16.66 5.19-22.668 11.645-8.295 8.913-11.603 19.783-9.976 31.994 1.2 9 5.529 16.51 11.959 22.573 8.703 8.204 19.725 10.675 31.317 10.68 95.615.05 191.23.055 286.845-.03 6.245-.006 12.49-.87 19.453-1.805M685.437 580c4.436-.336 8.892-.502 13.302-1.043 9.01-1.105 16.616-5.43 22.554-11.968 7.913-8.715 11.209-19.225 9.738-31.126-1.163-9.412-5.581-17.137-12.31-23.437-8.932-8.362-20.263-10.374-31.946-10.383-91.99-.077-183.981-.07-275.972 0a346 346 0 0 0-26.3 1.035c-9.088.702-16.63 5.313-22.626 11.763-8.164 8.781-11.416 19.493-9.895 31.553 1.14 9.034 5.394 16.552 11.757 22.68 8.485 8.17 19.304 10.877 30.743 10.886 96.657.07 193.314.04 290.955.04m-321.91 62.987c-9.141 9.502-13.28 20.723-11.503 33.907 1.186 8.801 5.457 16.184 11.71 22.181 8.498 8.153 19.3 10.876 30.736 10.885q135.948.11 271.895-.004c10.599-.01 21.212-.374 31.79-1.033 9.288-.578 16.992-5.24 23.072-11.872 7.951-8.674 11.248-19.178 9.812-31.088-1.136-9.425-5.548-17.157-12.236-23.469-8.888-8.389-20.227-10.44-31.91-10.45-94.962-.079-189.926-.004-284.889-.089-13.708-.012-26.98.95-38.477 11.032"/><path fill="#FFF" d="M701.22 448.372c-6.603.7-12.848 1.563-19.093 1.568-95.615.086-191.23.082-286.845.032-11.592-.006-22.614-2.477-31.317-10.681-6.43-6.063-10.76-13.573-11.959-22.573-1.627-12.21 1.68-23.081 9.976-31.994 6.008-6.455 13.59-10.99 22.668-11.645a398 398 0 0 1 28.286-1.035c91.284-.073 182.568-.078 273.852-.002 11.68.01 23.003 2.028 31.93 10.383 6.728 6.296 11.146 14.018 12.312 23.424 1.475 11.894-1.778 22.44-9.739 31.098-5.203 5.658-11.55 10.27-20.07 11.425M684.945 580c-97.149 0-193.806.03-290.463-.04-11.439-.009-22.258-2.716-30.743-10.887-6.363-6.127-10.618-13.645-11.757-22.68-1.521-12.06 1.73-22.77 9.895-31.552 5.996-6.45 13.538-11.06 22.627-11.763a345 345 0 0 1 26.299-1.034c91.99-.071 183.981-.078 275.972-.001 11.683.01 23.014 2.021 31.945 10.383 6.73 6.3 11.148 14.025 12.31 23.437 1.472 11.9-1.824 22.411-9.737 31.126-5.938 6.539-13.544 10.863-22.554 11.968-4.41.541-8.866.707-13.794 1.043M363.79 642.734c11.233-9.828 24.506-10.79 38.214-10.779 94.963.085 189.927.01 284.89.09 11.682.01 23.02 2.06 31.91 10.45 6.687 6.31 11.1 14.043 12.235 23.468 1.436 11.91-1.86 22.414-9.812 31.088-6.08 6.632-13.784 11.294-23.071 11.872-10.579.66-21.192 1.024-31.791 1.033q-135.948.114-271.895.004c-11.436-.01-22.238-2.732-30.737-10.885-6.252-5.997-10.523-13.38-11.709-22.18-1.777-13.185 2.362-24.406 11.766-34.161"/></svg>'

  return ''
    + '<div id="options" class="adminActions">'
    + '<input type="checkbox" name="adminToggle" id="checkAdmin" class="adminToggle"/>'
    + '<span id="loading" class="load"></span>'
    + '<button id="buttonOptions" class="adminButton" href="javascript:">' + imgBot + '</button>'
    + '<div class="adminButtons">'
    + '<button title="Ativar este cliente" id="play" class="hide">' + imgPlay + ' Ativar</button>'
    + '<button title="Pausar este cliente" id="pause" class="hide">'+ imgPause +' Pausar</button>'
    + '<button title="Mandar mensagem de boas-vindas" id="restart" class="hide">' + imgRestart + ' Iniciar</button>'
    + '<button title="Enviar link ou cardápio/" id="menu">' + imgMenu + ' Cardápio</button>'
    + '<button title="Adicionar cliente à Blocklist" id="stop" class="hide">'+ imgStop +' Bloquear</button>'
    + '</div>'
    + '</div>';
}

function fillContact(contact) {
  btnLoading.classList.add("hide");

  if (localStorage.getItem('pauseWpp') === '1') {
    buttonOptions.classList.add('disabled');
    return;
  }

  if (!contact || contact.status === '1') {
    buttonStop.classList.remove("hide");
    buttonPause.classList.remove("hide");
    buttonRestart.classList.remove("hide");

  } else {
    buttonOptions.classList.add('paused');
    buttonPlay.classList.remove("hide");
    buttonRestart.classList.remove("hide");
  }
}

function enviarComando(senderId, msg) {
  document.dispatchEvent(new CustomEvent('toggle-reply', {
    detail: { text: msg, from: senderId }
  }));

  btnLoading.classList.remove("hide");
  checkAdmin.checked = false;

  setTimeout(() => {
    btnLoading.classList.add("hide");
  }, 2000);
}

function openChat(detail) {
  if (lebot === 2) {
    API_LEBOT.chat.openChatBottom(detail);

  } else {
    API_LEBOT.openChatByNumber(detail, "");
  }
}

function markUnread(detail) {
  if (lebot === 2) {
    API_LEBOT.chat.markIsUnread(detail);

  } else {
    const chat = Core.chat(detail);

    if (chat) {
      window.Store.MarkUnread(chat, true);
    }
  }
}