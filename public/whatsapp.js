document.addEventListener('seen_send', function (e) {
  window.API.sendSeen(e.detail.sender, function(){
    console.log("VISUALIZADO");
  });
}, false);

const intervalTry = setInterval(() => {
  if (window.API.listener !== undefined) {
    clearInterval(intervalTry);

    window.API.listener.ExternalHandlers.MESSAGE_RECEIVED.push(function (sender, chat, msg) {

      if (!msg.isGroupMsg && !msg.isStatusV3 && !localStorage.getItem('pauseWpp')) {
        // const event_send_seen = new CustomEvent('seen_received', { 'detail': { sender: sender._serialized } });
        // document.dispatchEvent(event_send_seen);

        const isMe = msg.__x_isSentByMe;
        const chatId = isMe ? msg.__x_to._serialized : sender._serialized;
        const body = msg.__x_body;

        if (msg.__x_type !== "chat" && msg.__x_type !== "ptt") {
          return;
        }

        const clearmessage = body ? body.trim().toLowerCase() : "";
        if ((!isMe || clearmessage.startsWith("lebot")) && !clearmessage.startsWith("#")) {

          const detail = {
            from: chatId,
            text: body ? body : "#",
            isMe,
            isAudio: msg.__x_type === "ptt"
          };

          if (!isMe && msg.__x_senderObj) {
            detail.contact = msg.__x_senderObj.pushname;
            detail.number = sender.user;
          }

          const event = new CustomEvent('message_received', { detail });
          document.dispatchEvent(event);
        }
      }

    });

  } else {
    console.log("not listener yet")
  }
}, 3000);

function sendMessage(senderId, message, callback){
  if (message.type === "image") {
    API.sendImageMessage(senderId, message.content, message.caption, () => {
      callback();
    })
  } else {
    API.sendTextMessage(senderId, message.content, function () {
      // console.log("enviado");
      callback();
    })
  }
}

document.addEventListener('inject-script', function () {
  startup();
}, false);

function startup() {
  if (document.getElementById('pane-side')) {
    try {
      injectScript();

    } catch (e) {
      console.log(e);
      document.dispatchEvent(new CustomEvent('inject-script-fail'));
    }

  } else {
    console.log('Startup AGAIN');
    setTimeout(function () {
      startup();
    }, 4000);
  }
}

function injectScript() {
  window.API.init();

  const me = window.API.getMe();
  if (me && me.__x_wid && me.__x_wid.user) {
    console.log('Me:', me.__x_wid.user);
    document.dispatchEvent(new CustomEvent('inject-script-done'));

    injectEmpresa();

  } else {
    console.log('Not Inject');
    document.dispatchEvent(new CustomEvent('inject-script-fail'));
  }
}

function injectEmpresa() {
  const base = document.getElementsByTagName("header");
  const nome = sessionStorage.getItem('nome_fantasia');
  const url_imagem = sessionStorage.getItem('url_imagem');

  if (base && base.length && nome) {
    const img = document.querySelectorAll('[data-asset-intro-image-light]');
    if (url_imagem && img && img.length) {
      img[0].style.cssText = "background-image: url('"+url_imagem+"');";
    }

    const el = document.createElement("h1");
    el.innerHTML = nome;
    el.style.cssText = "width: 185px;";

    const elImg = base[0].firstElementChild;
    elImg.parentNode.insertBefore(el, elImg.nextSibling);
  }
}
