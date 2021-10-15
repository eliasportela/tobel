document.addEventListener('seen_send', function (e) {
  window.API.sendSeen(e.detail.sender, function(){
    console.log("VISUALIZADO");
  });
}, false);

const intervalTry = setInterval(() => {
  if (window.API.listener !== undefined) {
    clearInterval(intervalTry);

    console.log("LEBOT INICIADO");
    checkPhone();

    window.API.listener.ExternalHandlers.MESSAGE_RECEIVED.push(function (sender, chat, msg) {

      if (!msg.isGroupMsg && !msg.isStatusV3 && !localStorage.getItem('pauseWpp')) {
        // const event_send_seen = new CustomEvent('seen_received', { 'detail': { sender: sender._serialized } });
        // document.dispatchEvent(event_send_seen);

        const isMe = msg.__x_isSentByMe;
        const chatId = isMe ? msg.__x_to._serialized : sender._serialized;
        const body = msg.__x_body;

        if (msg.__x_type !== "chat" && msg.__x_type !== "ptt" && msg.__x_type !== "location") {
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

          if (msg.__x_type === "location" && (!msg.__x_isLive || ((msg.__x_isLive && msg.__x_chat.__x_liveLocation !== undefined)))) {
            detail.location = { lat: msg.__x_lat, lng: msg.__x_lng };
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

function checkPhone() {
  setTimeout(() => {
    const phone = window.localStorage['last-wid'].replace(/"/g, "").split('@')[0]

    if (phone) {
      console.log("Phone: " + phone);
      injectEmpresa();
      makeSmartOptions();
    }

  }, (2000));
}

let blocklist = [];

function fillBlockList(list) {
  console.log(list);
  blocklist = list;
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

let interval = null;
let buttonStop = null;
let buttonPlay = null;
let buttonPause = null;

function makeSmartOptions() {
  clearInterval(interval);

  interval = setInterval(() => {
    var footer = document.getElementsByTagName("footer")[0];

    if (footer != undefined && footer.dataset.appliend == undefined) {
      footer.dataset.appliend = true;
      var div = (footer.getElementsByTagName('div')[0]);

      if (div != undefined) {
        var myButton = mountMyButton();
        var newDiv = document.createElement('div');

        newDiv.innerHTML = myButton;
        newDiv.style.width = "50px";
        newDiv.style.height = "50px";
        newDiv.style.marginRight = "10px";

        buttonPause = newDiv.querySelector("#pause");
        buttonPause.addEventListener("click", () => {
          document.dispatchEvent(new CustomEvent('toggle-reply', { detail: "lebot ok" }));

          buttonPause.classList.add("hide");
          buttonPlay.classList.remove("hide");
          buttonStop.classList.remove("hide");
        });

        buttonStop = newDiv.querySelector("#stop");
        buttonStop.addEventListener("click", () => {
          document.dispatchEvent(new CustomEvent('toggle-reply', { detail: "lebot add" }));

          buttonPlay.classList.remove("hide");
          buttonPause.classList.add("hide");
          buttonStop.classList.add("hide");
        });

        buttonPlay = newDiv.querySelector("#play");
        buttonPlay.addEventListener("click", () => {
          document.dispatchEvent(new CustomEvent('toggle-reply', { detail: "lebot remover" }));

          buttonPlay.classList.add("hide");
          buttonPause.classList.remove("hide");
          buttonStop.classList.remove("hide");
        });

        div.insertBefore(newDiv, div.children[2]);
        active_tab();
      }

    } else {
      makeSmartOptions();
    }
  }, 1000);
}

function active_tab() {
  const user = window.API.getActiveTab();
  let senderId = undefined;

  if (user != undefined){
    senderId = user.__x_id._serialized;

    if (blocklist.find(user => user.id_user === senderId)) {
      buttonPlay.classList.remove("hide");
      buttonStop.classList.add("hide");
      buttonPause.classList.add("hide");

    } else {
      buttonPlay.classList.add("hide");
      buttonStop.classList.remove("hide");
      buttonPause.classList.remove("hide");
    }
  }
}

function mountMyButton() {
  var imgURL = 'data:image/png;base64,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';
  var imgPause = '<svg enable-background="new 0 0 39.989 39.989" version="1.1" viewBox="0 0 39.989 39.989" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" fill="#F6C23E"><path d="M19.995,0C8.952,0,0,8.952,0,19.994c0,11.043,8.952,19.995,19.995,19.995s19.995-8.952,19.995-19.995  C39.989,8.952,31.037,0,19.995,0z M18.328,26.057c0,0.829-0.671,1.5-1.5,1.5s-1.5-0.671-1.5-1.5V14.724c0-0.829,0.671-1.5,1.5-1.5  s1.5,0.671,1.5,1.5V26.057z M24.661,26.057c0,0.829-0.671,1.5-1.5,1.5s-1.5-0.671-1.5-1.5V14.724c0-0.829,0.671-1.5,1.5-1.5  s1.5,0.671,1.5,1.5V26.057z"/></svg>';
  var imgPlay = '<svg enable-background="new 0 0 496 496" version="1.1" viewBox="0 0 496 496" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M496,248c0,136.8-111.2,248-248,248S0,384.8,0,248S111.2,0,248,0S496,111.2,496,248z" fill="#4762b4"/><path d="M248,0c136.8,0,248,111.2,248,248S384.8,496,248,496" fill="#506eca"/><path d="m72.8 72.8c96.8-96.8 253.6-96.8 350.4 0s96.8 253.6 0 350.4" fill="#597BE1"/><path d="m212.8 360.8c-1.6 0-4-0.8-5.6-1.6-4-1.6-7.2-6.4-7.2-10.4v-149.6c0-4 3.2-8.8 7.2-10.4s8.8-1.6 12.8 0.8l101.6 75.2c3.2 2.4 4.8 5.6 4.8 9.6s-1.6 7.2-4.8 9.6l-101.6 75.2c-2.4 0.8-4.8 1.6-7.2 1.6z" fill="#4762b4"/><path d="m212.8 334.4c-1.6 0-4-0.8-5.6-1.6-4-1.6-7.2-6.4-7.2-10.4v-149.6c0-4 3.2-8.8 7.2-10.4s8.8-1.6 12.8 0.8l101.6 75.2c3.2 2.4 4.8 5.6 4.8 9.6s-1.6 7.2-4.8 9.6l-101.6 75.2c-2.4 0.8-4.8 1.6-7.2 1.6z" fill="#fff"/></svg>';
  const imgStop = '<svg enable-background="new 0 0 496 496" version="1.1" viewBox="0 0 496 496" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M496,248c0,136.8-111.2,248-248,248S0,384.8,0,248S111.2,0,248,0S496,111.2,496,248z" fill="#F73974"/><path d="M248,0c136.8,0,248,111.2,248,248S384.8,496,248,496" fill="#DD0772"/><path d="m72.8 72.8c96.8-96.8 253.6-96.8 350.4 0s96.8 253.6 0 350.4" fill="#ED266E"/><path d="m320 238.4c0-16.8-13.6-30.4-30.4-30.4h-83.2c-16.8 0-30.4 13.6-30.4 30.4v84c0 16.8 13.6 30.4 30.4 30.4h84c16.8 0 30.4-13.6 30.4-30.4v-84h-0.8z" fill="#DD0772"/><path d="m320 206.4c0-16.8-13.6-30.4-30.4-30.4h-83.2c-16.8 0-30.4 13.6-30.4 30.4v84c0 16.8 13.6 30.4 30.4 30.4h84c16.8 0 30.4-13.6 30.4-30.4v-84h-0.8z" fill="#fff"/></svg>'

  var html = ''
    + '<div id="options" class="adminActions">'
    + '<input type="checkbox" name="adminToggle" id="checkAdmin" class="adminToggle" checked/>'
    + '<span id="loading" class="hide load"></span>'
    + ' <button id="buttonOptions" class="adminButton" href="#!">'
    + '<img src="' + imgURL + '"></img>'
    + '</button>'
    + '<div class="adminButtons">'
    + '<button title="Pausar o LeBot p/ este cliente" id="pause" >'+ imgPause +'</button>'
    + '<button title="Adicionar usuário à Blocklist" id="stop" >'+ imgStop +'</button>'
    + '<button title="Remover usuário da Blocklist" id="play" class="hide">' + imgPlay + '</button>'
    + '</div>'
    + '</div>';

  return html;
}
