let WPP = null;
let injectedCount = 0;
let interval = null;
let buttonStop = null;
let buttonPlay = null;
let buttonPause = null;
let senderId = null;
let phone = null;
let main_ready = false;

document.addEventListener('send-message', function (e) {
  if (WPP) {
    sendMessage(e.detail.from, e.detail.msg)
  }
}, false);

document.addEventListener('fill-contact', function (e) {
  if (WPP) {
    fillContact(e.detail);
  }
}, false);

document.addEventListener('open-chat', async function (e) {
  if (WPP) {
    await WPP.chat.openChatBottom(e.detail.to);
  }
}, false);

const intervalTry = setInterval(() => {
  if (typeof window.WPP !== "undefined") {
    clearInterval(intervalTry);
    console.log("LEBOT INICIADO");
    WPP = window.WPP;

    WPP.on('conn.main_ready', () => {
      if (!main_ready) {
        main_ready = true;
        console.log("checking phone");
        const id = WPP.conn.getMyUserId();

        if (id) {
          phone = id.user || null;
          console.log("phone: " + phone);
          document.dispatchEvent(new CustomEvent('bot_number', { detail: phone }));
        }
      }
    });

    WPP.on('chat.new_message', (msg) => {
      if (!msg.isGroupMsg && !msg.__x_isStatusV3) {
        const isPaused = localStorage.getItem('pauseWpp') === '1';
        const type = msg.__x_type;

        if (["ptt", "chat"].includes(type) && !isPaused) {
          const isMe = msg.__x_id && msg.__x_id.fromMe;
          const botNumber = msg.__x_to && msg.__x_to._serialized ? msg.__x_to._serialized : '';
          const from = isMe ? botNumber : msg.__x_senderObj.__x_id._serialized;
          const text = msg.__x_body || '#';
          const clearmessage = text ? text.trim().toLowerCase() : "";

          if (type === 'ptt') {
            setTimeout(() => {
              sendMessage(from, { content: "Desculpe, ainda não consigo entender áudios 😥. Posso te ajudar se me enviar frases ou perguntas curtas." });
            }, 1500);

          } else if ((!isMe || clearmessage.startsWith("lebot")) && !clearmessage.startsWith("#")) {
            const detail = { isMe, from, botNumber, text, isAudio: false };

            if (!isMe && msg.__x_senderObj) {
              detail.contact = msg.__x_senderObj.pushname;
              detail.number = msg.__x_senderObj.userid;
            }

            document.dispatchEvent(new CustomEvent('message_received', { detail }));
          }
        }
      }
    });

    WPP.on('chat.active_chat', (chat) => {
      makeSmartOptions(chat);
    });

  } else {
    console.log("not listener yet")
  }
}, 3000);

function sendMessage(senderId, message, callback) {
  if (message.type === "image") {
    WPP.chat.sendFileMessage(senderId, `data:image/jpeg;base64,${message.content}`, { type: 'image', caption: message.caption })
      .then(() => {
        if (callback) {
          callback();
        }}
      );

  } else {
    WPP.chat.sendTextMessage(senderId, message.content, { createChat: true }).then(() => {
      if (callback) {
        callback();
      }
    });
  }
}

function makeSmartOptions(user) {
  const footer = document.getElementsByTagName("footer")[0];

  if (footer != undefined && footer.dataset.appliend == undefined) {
    footer.dataset.appliend = true;
    const div = (footer.getElementsByTagName('div')[0]);
    senderId = null;

    if (div != undefined) {
      senderId = user.__x_id._serialized;
      const isPaused = localStorage.getItem('pauseWpp') === '1';

      if (user.__x_isGroup || isPaused) {
        return;
      }

      document.dispatchEvent(new CustomEvent('contact', {
        detail: {from: senderId}
      }))

      const myButton = mountMyButton();
      const newDiv = document.createElement('div');

      newDiv.innerHTML = myButton;
      newDiv.style.width = "50px";
      newDiv.style.height = "50px";

      buttonPause = newDiv.querySelector("#pause");
      buttonPause.addEventListener("click", () => {
        enviarComando(senderId, "lebot ok");
        buttonPause.classList.add("hide");
        buttonPlay.classList.remove("hide");
        buttonStop.classList.remove("hide");
      });

      buttonStop = newDiv.querySelector("#stop");
      buttonStop.addEventListener("click", () => {
        enviarComando(senderId, "lebot add");
        buttonPlay.classList.remove("hide");
        buttonPause.classList.add("hide");
        buttonStop.classList.add("hide");
      });

      buttonPlay = newDiv.querySelector("#play");
      buttonPlay.addEventListener("click", () => {
        enviarComando(senderId, "lebot remover");
        buttonPlay.classList.add("hide");
        buttonPause.classList.remove("hide");
        buttonStop.classList.remove("hide");
      });

      div.insertBefore(newDiv, div.children[2]);
    }
  }
}

function mountMyButton() {
  const imgURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAh1BMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9qkf8RAAAALHRSTlMAPy1J5Cb31PGrjzhuW38zG8JnpZoSCKDeyATsYVAWDbyVibFWILfZds96hNFIrQ4AAApgSURBVHja7NtrdqJAEAXgUhEhikZ8BJQkmmQ0JHf/65uc+TMziQqI3ae7uN8WKKgnQkREREREREREREREREREREREREREhqzHk4d5EOKPKNvti6F0x6qIA/xQvoylEwZxhDPydCPaFSUuCSaiWnJElbInas12qONOlPpETfm9KDTMUVukMB8kaETdh2CKhpTFwBKN/RJFYjQXiB4xrhGLFktc51F0mOJKoY7GYIBTulMSPqGFlXivnwGdDYFhsZ+jldDjEOi9jNDecfAsPtqkOW5ke3jvi28mGW5ql4hPBiPc3OhNfLFewohXT4Yk4wyGRF5UxgkM8mBg/AGj3sVxUxiWitM+0JiqQVkC8yKHO+Q+bFiIswJY4WxdvIAdc3FTD+d0JAQC2LIUF6W4oAuJIEIb/q8NU1j0Ke45wqKDOGcGmzJxzh0a07UtyFBNcyUwRA2aW8ICNWjOg3tU0B4BO9g1E8ccYZdrd+XrLayKXFsXrkJYNRLH3ONqOo6nnkJU07wfeY5QTXMh2GYapOOAMkdTyu6GYlTRXAXUXokpHov3UEVzJ/RlE8GaXFy0wEW6c6Ddd+BB3BTAjq2TS5HKvYDiUUidENDcBfw1gAV7cdgrTtPcBv9nHeEc/ccxZ9djynugb95wUjcuBE/vR5R3ABcPBTv4/E1WA1vxRIl/dKAD+OGACtr/oV3AiNC1VVDNSxHNR0GVw8FO5gBjXbEnv0t9eYQJpXjjN3t32qYmDAQAeLhvBBFEUVQQz/n/v69KSzgj2G626vJ+6vpsXcMRk8lk4JAFG94Gj8QnJ4TQOUh89Fog1TLCqg9Kj19mWfy/soUEGChznGwDTAgioqwt/2EszH57wHKBN9EaWIio4xH2AwET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';
  const imgPause = '<svg enable-background="new 0 0 39.989 39.989" version="1.1" viewBox="0 0 39.989 39.989" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" fill="#F6C23E"><path d="M19.995,0C8.952,0,0,8.952,0,19.994c0,11.043,8.952,19.995,19.995,19.995s19.995-8.952,19.995-19.995  C39.989,8.952,31.037,0,19.995,0z M18.328,26.057c0,0.829-0.671,1.5-1.5,1.5s-1.5-0.671-1.5-1.5V14.724c0-0.829,0.671-1.5,1.5-1.5  s1.5,0.671,1.5,1.5V26.057z M24.661,26.057c0,0.829-0.671,1.5-1.5,1.5s-1.5-0.671-1.5-1.5V14.724c0-0.829,0.671-1.5,1.5-1.5  s1.5,0.671,1.5,1.5V26.057z"/></svg>';
  const imgPlay = '<svg enable-background="new 0 0 496 496" version="1.1" viewBox="0 0 496 496" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M496,248c0,136.8-111.2,248-248,248S0,384.8,0,248S111.2,0,248,0S496,111.2,496,248z" fill="#4762b4"/><path d="M248,0c136.8,0,248,111.2,248,248S384.8,496,248,496" fill="#506eca"/><path d="m72.8 72.8c96.8-96.8 253.6-96.8 350.4 0s96.8 253.6 0 350.4" fill="#597BE1"/><path d="m212.8 360.8c-1.6 0-4-0.8-5.6-1.6-4-1.6-7.2-6.4-7.2-10.4v-149.6c0-4 3.2-8.8 7.2-10.4s8.8-1.6 12.8 0.8l101.6 75.2c3.2 2.4 4.8 5.6 4.8 9.6s-1.6 7.2-4.8 9.6l-101.6 75.2c-2.4 0.8-4.8 1.6-7.2 1.6z" fill="#4762b4"/><path d="m212.8 334.4c-1.6 0-4-0.8-5.6-1.6-4-1.6-7.2-6.4-7.2-10.4v-149.6c0-4 3.2-8.8 7.2-10.4s8.8-1.6 12.8 0.8l101.6 75.2c3.2 2.4 4.8 5.6 4.8 9.6s-1.6 7.2-4.8 9.6l-101.6 75.2c-2.4 0.8-4.8 1.6-7.2 1.6z" fill="#fff"/></svg>';
  const imgStop = '<svg enable-background="new 0 0 496 496" version="1.1" viewBox="0 0 496 496" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M496,248c0,136.8-111.2,248-248,248S0,384.8,0,248S111.2,0,248,0S496,111.2,496,248z" fill="#F73974"/><path d="M248,0c136.8,0,248,111.2,248,248S384.8,496,248,496" fill="#DD0772"/><path d="m72.8 72.8c96.8-96.8 253.6-96.8 350.4 0s96.8 253.6 0 350.4" fill="#ED266E"/><path d="m320 238.4c0-16.8-13.6-30.4-30.4-30.4h-83.2c-16.8 0-30.4 13.6-30.4 30.4v84c0 16.8 13.6 30.4 30.4 30.4h84c16.8 0 30.4-13.6 30.4-30.4v-84h-0.8z" fill="#DD0772"/><path d="m320 206.4c0-16.8-13.6-30.4-30.4-30.4h-83.2c-16.8 0-30.4 13.6-30.4 30.4v84c0 16.8 13.6 30.4 30.4 30.4h84c16.8 0 30.4-13.6 30.4-30.4v-84h-0.8z" fill="#fff"/></svg>'

  return ''
    + '<div id="options" class="adminActions">'
    + '<input type="checkbox" name="adminToggle" id="checkAdmin" class="adminToggle" checked/>'
    + '<span id="loading" class="hide load"></span>'
    + ' <button id="buttonOptions" class="adminButton" href="#!">'
    + ' <img src="' + imgURL + '"/>'
    + '</button>'
    + '<div class="adminButtons">'
    + '<button title="Pausar o LeBot p/ este cliente" id="pause" class="hide">'+ imgPause +'</button>'
    + '<button title="Ativar o LeBot p/ este cliente" id="play" class="hide">' + imgPlay + '</button>'
    + '<button title="Adicionar usuário à Blocklist" id="stop" class="hide">'+ imgStop +'</button>'
    + '</div>'
    + '</div>';
}

function fillContact(contact) {
    if (!contact || contact.status === '1') {
    buttonStop.classList.remove("hide");
    buttonPause.classList.remove("hide");

  } else {
    buttonPlay.classList.remove("hide");
  }
}

function enviarComando(senderId, msg) {
  document.dispatchEvent(new CustomEvent('toggle-reply', {
    detail: { text: msg, from: senderId }
  }))
}