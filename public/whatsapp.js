function initWhatsapp () {
  window.WappBot = {};

  /* eslint-disable */
  /**
   * This script contains WAPI functions that need to be run in the context of the webpage
   */

  /**
   * Auto discovery the webpack object references of instances that contains all functions used by the WAPI
   * functions and creates the Store object.
   */
  if (!window["webpackJsonp"]) {
    window.webpackJsonp = webpackJsonp;
  }

  if (!window.Store) {
    (function () {
      function getStore(modules) {
        let foundCount = 0;
        let neededObjects = [
          { id: "Store", conditions: (module) => (module.default && module.default.Chat && module.default.Msg) ? module.default : null },
          { id: "MediaCollection", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.processAttachments) ? module.default : null },
          { id: "MediaProcess", conditions: (module) => (module.BLOB) ? module : null },
          { id: "Wap", conditions: (module) => (module.createGroup) ? module : null },
          { id: "ServiceWorker", conditions: (module) => (module.default && module.default.killServiceWorker) ? module : null },
          { id: "State", conditions: (module) => (module.STATE && module.STREAM) ? module : null },
          { id: "WapDelete", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
          { id: "Conn", conditions: (module) => (module.default && module.default.ref && module.default.refTTL) ? module.default : null },
          { id: "WapQuery", conditions: (module) => (module.queryExist) ? module : ((module.default && module.default.queryExist) ? module.default : null) },
          { id: "CryptoLib", conditions: (module) => (module.decryptE2EMedia) ? module : null },
          { id: "OpenChat", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.openChat) ? module.default : null },
          { id: "UserConstructor", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null },
          { id: "SendTextMsgToChat", conditions: (module) => (module.sendTextMsgToChat) ? module.sendTextMsgToChat : null },
          { id: "SendSeen", conditions: (module) => (module.sendSeen) ? module.sendSeen : null },
          { id: "sendDelete", conditions: (module) => (module.sendDelete) ? module.sendDelete : null }
        ];
        for (let idx in modules) {
          if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
            let first = Object.values(modules[idx])[0];
            if ((typeof first === "object") && (first.exports)) {
              for (let idx2 in modules[idx]) {
                let module = modules(idx2);
                if (!module) {
                  continue;
                }
                neededObjects.forEach((needObj) => {
                  if (!needObj.conditions || needObj.foundedModule)
                    return;
                  let neededModule = needObj.conditions(module);
                  if (neededModule !== null) {
                    foundCount++;
                    needObj.foundedModule = neededModule;
                  }
                });
                if (foundCount == neededObjects.length) {
                  break;
                }
              }

              let neededStore = neededObjects.find((needObj) => needObj.id === "Store");
              window.Store = neededStore.foundedModule ? neededStore.foundedModule : {};
              neededObjects.splice(neededObjects.indexOf(neededStore), 1);
              neededObjects.forEach((needObj) => {
                if (needObj.foundedModule) {
                  window.Store[needObj.id] = needObj.foundedModule;
                }
              });
              window.Store.sendMessage = function (e) {
                return window.Store.SendTextMsgToChat(this, ...arguments);
              }
              return window.Store;
            }
          }
        }
      }

      //webpackJsonp([], { 'parasite': (x, y, z) => getStore(z) }, ['parasite']);
      /*
      Code update
      */
      if (typeof webpackJsonp === 'function') {
        webpackJsonp([], {'parasite': (x, y, z) => getStore(z)}, ['parasite']);
      } else {
        webpackJsonp.push([
          ['parasite'],
          {
            parasite: function (o, e, t) {
              getStore(t);
            }
          },
          [['parasite']]
        ]);
      }
    })();
  }

  window.WAPI = {
    lastRead: {}
  };

  window.WAPI._serializeRawObj = obj => {
    if (obj) {
      return obj.toJSON();
    }
    return {};
  };

  /**
   * Serializes a chat object
   *
   * @param rawChat Chat object
   * @returns {{}}
   */

  window.WAPI._serializeChatObj = obj => {
    if (obj == undefined) {
      return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
      kind: obj.kind,
      isGroup: obj.isGroup,
      contact: obj["contact"] ? window.WAPI._serializeContactObj(obj["contact"]) : null,
      groupMetadata: obj["groupMetadata"] ? window.WAPI._serializeRawObj(obj["groupMetadata"]) : null,
      presence: obj["presence"] ? window.WAPI._serializeRawObj(obj["presence"]) : null,
      msgs: null
    });
  };

  window.WAPI._serializeContactObj = obj => {
    if (obj == undefined) {
      return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
      formattedName: obj.formattedName,
      isHighLevelVerified: obj.isHighLevelVerified,
      isMe: obj.isMe,
      isMyContact: obj.isMyContact,
      isPSA: obj.isPSA,
      isUser: obj.isUser,
      isVerified: obj.isVerified,
      isWAContact: obj.isWAContact,
      profilePicThumbObj: obj.profilePicThumb ? WAPI._serializeProfilePicThumb(obj.profilePicThumb) : {},
      statusMute: obj.statusMute,
      msgs: null
    });
  };

  window.WAPI._serializeMessageObj = obj => {
    if (obj == undefined) {
      return null;
    }

    return Object.assign(window.WAPI._serializeRawObj(obj), {
      id: obj.id._serialized,
      sender: obj["senderObj"] ? WAPI._serializeContactObj(obj["senderObj"]) : null,
      timestamp: obj["t"],
      content: obj["body"],
      isGroupMsg: obj.isGroupMsg,
      isLink: obj.isLink,
      isMMS: obj.isMMS,
      isMedia: obj.isMedia,
      isNotification: obj.isNotification,
      isPSA: obj.isPSA,
      type: obj.type,
      chat: WAPI._serializeChatObj(obj["chat"]),
      chatId: obj.id.remote,
      quotedMsgObj: WAPI._serializeMessageObj(obj["_quotedMsgObj"]),
      mediaData: window.WAPI._serializeRawObj(obj["mediaData"])
    });
  };

  window.WAPI._serializeNumberStatusObj = obj => {
    if (obj == undefined) {
      return null;
    }

    return Object.assign(
      {},
      {
        id: obj.jid,
        status: obj.status,
        isBusiness: obj.biz === true,
        canReceiveMessage: obj.status === 200
      }
    );
  };

  window.WAPI._serializeProfilePicThumb = obj => {
    if (obj == undefined) {
      return null;
    }

    return Object.assign(
      {},
      {
        eurl: obj.eurl,
        id: obj.id,
        img: obj.img,
        imgFull: obj.imgFull,
        raw: obj.raw,
        tag: obj.tag
      }
    );
  };

  /**
   * Fetches chat object from store by ID
   *
   * @param id ID of chat
   * @returns {T|*} Chat object
   */
  window.WAPI.getChat = function(id) {
    id = typeof id == "string" ? id : id._serialized;
    const found = window.Store.Chat.get(id);
    found.sendMessage = found.sendMessage
      ? found.sendMessage
      : function() {
        return window.Store.sendMessage.apply(this, arguments);
      };
    return found;
  };

  /**
   * Fetches all chat IDs from store
   *
   * @returns {Array|*} List of chat id's
   */
  window.WAPI.getAllChatIds = function() {
    const chatIds = window.Store.Chat.map(chat => chat.id._serialized || chat.id);
    return chatIds;
  };

  window.WAPI.getChatActive = function() {
    const user = window.Store.Chat.models ? window.Store.Chat.models.find(chat => chat.active) : false;
    return user && user.id && !user.isGroup ? user.id._serialized : false;
  };

  window.WAPI.processMessageObj = function(messageObj, includeMe, includeNotifications) {
    if (messageObj.isNotification) {
      if (includeNotifications) return WAPI._serializeMessageObj(messageObj);
      else return;
      // System message
      // (i.e. "Messages you send to this chat and calls are now secured with end-to-end encryption...")
    } else if (messageObj.id.fromMe === false || includeMe) {
      return WAPI._serializeMessageObj(messageObj);
    }
    return;
  };

  window.WAPI.sendImage = async function(chatid, image64, filename, caption) {
    let id = chatid;
    if (!window.WAPI.getAllChatIds().find(chat => chat == chatid))
      id = new window.Store.UserConstructor(chatid, { intentionallyUsePrivateConstructor: true });
    const chat = WAPI.getChat(id);
    if (chat) {
      try {
        var mediaBlob = window.WAPI.base64ImageToFile(image64, filename);
        var mc = new window.Store.MediaCollection(chat);
        mc.processAttachments([ { file: mediaBlob }, 1 ], chat, 1 ).then(() => {
          var media = mc.models[0];
          media.sendToChat(chat, { caption: caption });
        });

      } catch (error) {
        console.log(error)
      }
    }
  };

  window.WAPI.base64ImageToFile = function(image, filename) {
    var arr = image.split(",");
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, {
      type: mime
    });
  };

  window.WAPI.sendMessage = function(idChat, message) {
    let id = idChat;
    if (!window.WAPI.getAllChatIds().find(chat => chat == idChat))
      id = new window.Store.UserConstructor(idChat, { intentionallyUsePrivateConstructor: true });
    const chat = WAPI.getChat(id);
    try {
      // create new chat
      return chat.sendMessage(message);
    } catch (e) {
      return false;
    }
  };

  window.WappBot.toDataURL = url => {
    return new Promise(resolve => {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
          resolve(reader.result);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.open("GET", url);
      xhr.responseType = "blob";
      xhr.send();
    });
  };

  window.WappBot.prepareMessageToSend = (newMessage, chatId) => {
    // const user = validUsers.find((u) => u.chatId === chatId);
    // if (user && !localStorage.getItem('pauseWpp')) {
    if (!localStorage.getItem('pauseWpp')) {
      window.WAPI.sendMessage(chatId, newMessage);
    }
  };

  window.WappBot.prepareImageToSend = (chatId, image) => {
    window.WAPI.sendImage(chatId, image.content, image.filename, image.caption);
  };

  window.WAPI.getMe = () => {
    return window.Store.Conn;
  };

  /**
   * New messages observable functions.
   */
  window.WAPI._newMessagesQueue = [];
  window.WAPI._newMessagesBuffer =
    sessionStorage.getItem("saved_msgs") != null ? JSON.parse(sessionStorage.getItem("saved_msgs")) : [];
  window.WAPI._newMessagesDebouncer = null;
  window.WAPI._newMessagesCallbacks = [];

  if (window.Store.Msg) {
    window.Store.Msg.off("add");
    sessionStorage.removeItem("saved_msgs");

    window.WAPI._newMessagesListener = window.Store.Msg.on("add", newMessage => {
      if (newMessage && newMessage.isNewMsg && !newMessage.isGroupMsg) {
        let message = window.WAPI.processMessageObj(newMessage, true, false);

        if (!localStorage.getItem('pauseWpp') && message && !message.isMedia) {

          const chatId = message.chatId._serialized;
          if (chatId === "status@broadcast") {
            return;
          }

          if (!message.body) {
            window.WappBot.prepareMessageToSend("Desculpe, ainda não consigo enteder áudios. Posso te ajudar se me enviar frases ou perguntas curtas.", chatId);
            return;
          }

          const clearmessage = message.body.trim().toLowerCase();
          if ((!message.sender.isMe || clearmessage.startsWith("lebot")) && !clearmessage.startsWith("#")) {
            const detail = {
              from: chatId,
              text: message.body,
              isMe: message.sender.isMe
            };

            if (!message.sender.isMe) {
              detail.contact = message.sender.pushname;
              detail.number = message.chatId.user;
            }

            document.dispatchEvent(new CustomEvent('message_received', { detail }));
          }
        }
      }
    });

  }

  // function differenceTime(time) {
  //   const difference = Math.floor((new Date().getTime() - time)/1000/60);
  //   return difference === 0
  // }

  // window.WAPI._unloadInform = event => {
  //   // Save in the buffer the ungot unreaded messages
  //   window.WAPI._newMessagesBuffer.forEach(message => {
  //     Object.keys(message).forEach(key => (message[key] === undefined ? delete message[key] : ""));
  //   });
  //   sessionStorage.setItem("saved_msgs", JSON.stringify(window.WAPI._newMessagesBuffer));
  //
  //   // Inform callbacks that the page will be reloaded.
  //   window.WAPI._newMessagesCallbacks.forEach(function(callbackObj) {
  //     if (callbackObj.callback !== undefined) {
  //       callbackObj.callback({ status: -1, message: "page will be reloaded, wait and register callback again." });
  //     }
  //   });
  // };
}

// Button
// function initTab() {
//   let interval = undefined;
//   function makeSmartTab() {
//     clearInterval(interval);
//
//     interval = setInterval(() => {
//       const footer = document.getElementsByTagName("footer")[0];
//       if (footer !== undefined && footer.dataset.applied === undefined) {
//         footer.dataset.applied = 'true';
//
//         const event = new CustomEvent('active_tab', {'detail': {action: 'check_expired'}});
//         document.dispatchEvent(event);
//       }
//     }, 1000);
//   }
//
//   makeSmartTab();
// }

// document.addEventListener('active_tab', function (e) {
//   console.log('active_tab', e);
//
//   const user = window.WAPI.getChatActive();
//   if (user){
//     const event = new CustomEvent('action_active_tab', {
//       'detail': {
//         action: e.detail.action,
//         senderId: user
//       }
//     });
//     document.dispatchEvent(event);
//   }
//
// }, false);

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
  initWhatsapp();
  const me = window.WAPI.getMe();

  if (me && me.__x_wid && me.__x_wid.user) {
    console.log('Me:', me.__x_wid.user);
    document.dispatchEvent(new CustomEvent('inject-script-done'));

  } else {
    console.log('Not Inject');
    document.dispatchEvent(new CustomEvent('inject-script-fail'));
  }
}
