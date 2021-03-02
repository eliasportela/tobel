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

        if (!msg.__x_body) {
          if (!isMe) {
            const content = "Desculpe, ainda não consigo entender áudios 😥. Posso te ajudar se me enviar frases ou perguntas curtas.";
            sendMessage(chatId, { content });
          }

          return;
        }

        const clearmessage = msg.__x_body.trim().toLowerCase();
        if (msg.__x_type === "chat" && (!isMe || clearmessage.startsWith("lebot")) && !clearmessage.startsWith("#")) {
          const detail = {
            from: chatId,
            text: msg.__x_body,
            isMe
          };

          if (!isMe && msg.__x_senderObj) {
            detail.contact = msg.__x_senderObj.pushname;
            detail.number = sender.user;
          }

          // console.log(detail);
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

  } else {
    console.log('Not Inject');
    document.dispatchEvent(new CustomEvent('inject-script-fail'));
  }
}
