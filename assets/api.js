console.log('API loaded: 1.2.0');

/**
 * API WHATSAPP
 *
 * @link https://github.com/githubanotaai/api-whatsapp
 * @version 1.2.0
 */

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

let isConnected = () => window.localStorage['last-wid'] || window.localStorage['last-wid-md'];

const initialStateConnection = isConnected();
let pausedReceivers = [];
let platform = "anota-ai-desktop";
let lastReceivedMsg;
let settings;

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

const messageBlockWhats = [
    "Sua conta do WhatsApp foi desconectada. Para acessar a conta novamente, confirme seu nÃºmero de telefone",
    "You have been logged out. To log back in, you will need to verify your phone number"
]

const searchBlockedUser = () => {
    let countCheckTextBan = 0;
    const checkText = setInterval(() => {
        const bodyText = document.body.innerText || document.body.textContent;
        if (countCheckTextBan > 20) clearInterval(checkText);
        if (messageBlockWhats.some(item => bodyText.includes(item))) {
            console.log('Event: whats-block-ban');
            clearInterval(checkText);
            document.dispatchEvent(new CustomEvent('whats-block-ban'))
        }
        countCheckTextBan++
    }, 1000);
}

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

if (isConnected()) {
    console.log("Conectado!");
    document.dispatchEvent(new CustomEvent('has-conected'));
} else {
    console.log("Desconectado!");
    document.dispatchEvent(new CustomEvent('has-disconected'));
    searchBlockedUser();
}

document.addEventListener('settings', function (e) {
    console.log('set settings: ', e.detail);
    settings = e.detail;
}, false);

document.addEventListener('platform', function (e) {
    console.log('set platform: ', e.detail);
    platform = e.detail;
}, false);

const neededObjects = [
    {
        id: "MdCheck",
        conditions: (module) => (module && module.isLegacyWebdBackend) ? module : null
    },
    { id: "Store", conditions: (module) => (module.default && module.default.Chat && module.default.Msg) ? module.default : null },
    { id: "MediaCollection", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.processAttachments) ? module.default : null },
    { id: "MediaProcess", conditions: (module) => (module.BLOB) ? module : null },
    { id: "Wap", conditions: (module) => (module.createGroup) ? module : null },
    { id: "ServiceWorker", conditions: (module) => (module.default && module.default.killServiceWorker) ? module : null },
    { id: "State", conditions: (module) => (module.STATE && module.STREAM) ? module : null },
    { id: "WapDelete", conditions: (module) => (module.sendConversationDelete && module.sendConversationDelete.length == 2) ? module : null },
    { id: "Conn", conditions: (module) => (module.Conn) ? module.Conn : null },
    { id: "WapQuery", conditions: (module) => (module.queryExist) ? module : ((module.default && module.default.queryExist) ? module.default : null) },
    { id: "CryptoLib", conditions: (module) => (module.decryptE2EMedia) ? module : null },
    { id: "UserConstructor", conditions: (module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null },
    { id: "SendTextMsgToChat", conditions: (module) => (module.sendTextMsgToChat) ? module.sendTextMsgToChat : null },
    { id: "SendSeen", conditions: (module) => (module.sendSeen) ? module.sendSeen : null },
    { id: "sendDelete", conditions: (module) => (module.sendDelete) ? module.sendDelete : null },
    { id: "FeatureChecker", conditions: (module) => (module && module.getProtobufFeatureName) ? module : null },
    { id: "GetMaybeMeUser", conditions: (module) => (module && module.getMaybeMeUser) ? module : null },
    { id: "QueryExist", conditions: (module) => (module.queryExist) ? module : null },
    { id: "Cmd", conditions: (module) => (module.Cmd) ? module.Cmd : null },
    {
        id: "ChatUtilsSetArchive",
        conditions: (module) => (module.setArchive) ? module : null
    },
    {
        id: "ChatState",
        conditions: (module) => (module.sendChatStateComposing) ? module : null
    },
    {
        id: "WidFactory",
        conditions: (module) => (module.createWid) ? module : null
    },
    {
        id: "isMDBackend",
        conditions: (module) => (module.isMDBackend) ? module : null
    },
    {
        id: "PresenceUtils",
        conditions: (module) => (module.sendPresenceAvailable) ? module : null
    },
    {
        id: "MediaPrep",
        conditions: (module) => (module && module.uploadProductImage && module.MediaPrep) ? module : null
    },
    {
        id: "Socket",
        conditions: (module) => (module.Socket) ? module.Socket : null
    },
    {
        id: "Global",
        conditions: (module) => (module && module.StreamInfo) ? module : null
    },
    {
        id: "DownloadMedia",
        conditions: (module) => (module && module.downloadMedia) ? module : null
    },
    {
        id: "BlobCache",
        conditions: (module) => (module && module.InMemoryMediaBlobCache) ? module.InMemoryMediaBlobCache : null
    },
    {
        id: "MediaUpload",
        conditions: (module) => (module && module.uploadMedia) ? module : null
    },
    {
        id: "MediaObject",
        conditions: (module) => (module && module.getOrCreateMediaObject) ? module : null
    },
    {
        id: "GlobalUnixTime",
        conditions: (module) => (module && module.unixTime) ? module : null
    },
    {
        id: "CreateMsgKey",
        conditions: (module) => (module && module.default && module.default.fromString) ? module : null
    },
    {
        id: "AddWebpMetadata",
        conditions: (module) => (module && module.addWebpMetadata) ? module : null
    },
    {
        id: "DataFactory",
        conditions: (mod) => (mod.default && mod.default.createFromData) ? mod.default : null
    },
    {
        id: "MsgToMediaType",
        conditions: (module) => (module && module.msgToMediaType) ? module : null
    },
    {
        id: "AddAndSendMsgToChat",
        conditions: (module) => (module.addAndSendMsgToChat) ? module.addAndSendMsgToChat : null
    },

    //----------------------------------------------------------

    // COMUNIDADES

    {
        id: "getDefaultSubgroup",
        conditions: (module) => (module.getDefaultSubgroup) ? module : null
    },
    {
        id: "sendCreateCommunity",
        conditions: (module) => (module.sendCreateCommunity) ? module : null
    },
    {
        id: "queryAndUpdateCommunityParticipants",
        conditions: (module) => (module.queryAndUpdateCommunityParticipants) ? module : null
    },
    {
        id: "getCommunityParticipants",
        conditions: (module) => (module.getCommunityParticipants) ? module : null
    },
    {
        id: "sendPromoteDemoteAdminRPC",
        conditions: (module) => (module.sendPromoteDemoteAdminRPC) ? module : null
    },

];

const addObjectsStore = () => {
    window.Store.GroupUtils =  {
        ...window.require('WAWebGroupCreateJob'),
        ...window.require('WAWebGroupModifyInfoJob'),
        ...window.require('WAWebExitGroupAction'),
        ...window.require('WAWebContactProfilePicThumbBridge')
    }
    window.Store.GroupParticipants = {
        ...window.require('WAWebModifyParticipantsGroupAction'),
        ...window.require('WASmaxGroupsAddParticipantsRPC')
    };
    window.Store.GroupInvite = {
        ...window.require('WAWebGroupInviteJob'),
        ...window.require('WAWebGroupQueryJob')
    };
    window.Store.GroupInviteV4 = {
        ...window.require('WAWebGroupInviteV4Job'),
        ...window.require('WAWebChatSendMessages')
    };
    window.Store.MembershipRequestUtils = {
        ...window.require('WAWebApiMembershipApprovalRequestStore'),
        ...window.require('WASmaxGroupsMembershipRequestsActionRPC')
    };
    window.Store.MembershipRequestUtils = {
        ...window.require('WAWebApiMembershipApprovalRequestStore'),
        ...window.require('WASmaxGroupsMembershipRequestsActionRPC')
    };

    window.Store.CommunityUtils = {
        ...Store.getDefaultSubgroup,
        ...Store.sendCreateCommunity,
        ...Store.queryAndUpdateCommunityParticipants,
        ...Store.getCommunityParticipants,
        ...Store.sendPromoteDemoteAdminRPC,
    };
}

//-------------------------------------------------------------------------------------------------
// CÃ“DIGO ABSTRAIDO PARA CORE (window.Core)
//-------------------------------------------------------------------------------------------------

window.Core = {};

/*
Returns a WhatsApp GroupMetadata object from a given group id.
*/
window.Core.group = (_id) => {
    let result = null;
    (Store.GroupMetadata.models || Store.GroupMetadata.getModelsArray()).forEach(x => {
        if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
            result = x;
        }
    });
    return result;
}

/*
Returns a WhatsApp Contact object from a given contact id.
*/
window.Core.contact = (_id) => {
    let result = null;
    (Store.Contact.models || Store.Contact.getModelsArray()).forEach(x => {
        if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
            result = x;
        }
    });
    return result;
}

window.Core.activeTab = () => {
    let result = null;
    if (Store != undefined &&
        Store.Chat != undefined &&
        (Store.Chat.models != undefined ||
            Store.Chat.getModelsArray())) {

        (Store.Chat.models || Store.Chat.getModelsArray()).forEach(x => {
            if (x.hasOwnProperty("__x_active") && x.__x_active) {
                result = x;
            }
        });
    }

    return result;
}

/*
Returns a WhatsApp Chat object from a given chat id.
*/
window.Core.chat = (_id) => {
    let result = null;
    if (Store != undefined &&
        Store.Chat != undefined &&
        (Store.Chat.models != undefined ||
            Store.Chat.getModelsArray())) {

        (Store.Chat.models || Store.Chat.getModelsArray()).forEach(x => {
            if (x.hasOwnProperty("__x_id") && x.__x_id == _id) {
                result = x;
            }
        });
    }
    return result;
}

/*
Returns a WhatsApp Msg object from a given serialized messsage id
*/
window.Core.msg = (_id) => {
    let result = null;
    (Store.Msg.models || Store.Msg.getModelsArray()).forEach(x => {
        if (x.hasOwnProperty("__x_id") && x.__x_id._serialized == _id) {
            result = x;
        }
    });
    return result;
}

/*
Returns the element of a collection that satisfies a predicate condition.
*/
window.Core.find = (collection, predicate) => {
    let result = null;
    collection.forEach(x => {
        if (predicate(x)) {
            result = x;
        }
    });
    return result;
}

/*
Calls a callback with an error object.
*/
window.Core.error = (err, callback) => {
    setTimeout(x => { (callback || Core.nop)({ error: err }); }, 1);
}

/*
Does nothing.
*/
window.Core.nop = () => { }

// ------------------------------------------------------------------------------------------------
// TRATAMENTO PARA MENSAGENS RECEBIDAS OU ENVIADAS
// ------------------------------------------------------------------------------------------------

const Listener = function () {

    this.ExternalHandlers = {

        /*
        Parameters:
            1. The user that joined
            2. The user that added them (undefined if they used a link? Should be checked)
            3. The chat the user was added to
        */
        USER_JOIN_GROUP: [],

        /*
        Parameters:
            1. The user that was removed
            2. The user that removed them (undefined if they used a link? Should be checked)
            3. The chat the user was removed from
        */
        USER_LEAVE_GROUP: [],

        /*
        Parameters:
            1. The group ID
            2. The user that changed the title
            3. The new title
            4. The subject type (should be 'subject')
        */
        GROUP_SUBJECT_CHANGE: [],

        /*
        Parameters:
            1. Sender of the message
            2. Chat the message was sent at
            3. Parsed Msg object
        */
        MESSAGE_RECEIVED: [],

        /*
        Parameters:
            1. The chat the message was sent to
            2. Parsed Msg object
        */
        MESSAGE_SENT: []
    };

    /*
    Handlers for different message types
    */
    const handlers = [

        /*
        User join / leave group.
        */
        {
            predicate: msg => msg.__x_isNotification && msg.__x_eventType == "i" && msg.__x_type == "gp2",
            handler: function (msg) {
                var is_join = msg.__x_subtype == "add" || msg.__x_subtype == "invite";
                var is_leave = msg.__x_subtype == "leave" || msg.__x_subtype == "remove";
                var object = msg.__x_recipients[0];
                var subject = msg.__x_sender;
                var chat = msg.chat.__x_id;

                if (is_join) {
                    API.listener.ExternalHandlers.USER_JOIN_GROUP.forEach(x => x(object, subject, chat));
                }
                else if (is_leave) {
                    API.listener.ExternalHandlers.USER_LEAVE_GROUP.forEach(x => x(object, subject, chat));
                }
            }
        },

        /*
        Group subject change.
        */
        {
            predicate: msg => msg.__x_isNotification && msg.__x_eventType == "n",
            handler: function (msg) {
                var chat = msg.__x_to;
                var changer = msg.__x_sender;
                var new_title = msg.__x_body;
                var subtype = msg.__x_subtype;
                API.listener.ExternalHandlers.GROUP_SUBJECT_CHANGE.forEach(x => x(chat, changer, new_title, subtype));
            }
        },

        /*
        Message received
        */
        {
            predicate: msg => !msg.__x_isNotification && msg.__x_type !== "gp2",
            handler: function (msg) {
                var sender = msg.__x_sender || msg.__x_from;
                var chat = msg.__x_from;
                var message = msg.__x_id._serialized;
                const isFromMe = msg.__x_id.fromMe
                const sameMessage = lastReceivedMsg == msg
                if (msg.__x_from.server == "broadcast" || isFromMe) {
                    msg.__x_isStatusV3 = true;
                } else {
                    msg.__x_isStatusV3 = false;
                }

                if (msg.__x_from.server == "g.us") {
                    msg.__x_isGroupMsg = true;
                } else {
                    msg.__x_isGroupMsg = false;
                }

                if (isFromMe) {
                    msg.isMyself = true
                }
                if (sameMessage) {
                    return
                }

                //console.log('message received', msg)

                lastReceivedMsg = msg
                API.listener.ExternalHandlers.MESSAGE_RECEIVED.forEach(x => x(sender, chat, msg));
            }
        },

        /*
        Message sent
        */
        {
            predicate: msg => msg.__x_isUserCreatedType && !msg.__x_isNotification && msg.__x_isSentByMe,
            handler: function (msg) {
                var to = msg.__x_to;

                console.log('message sent', msg)

                API.listener.ExternalHandlers.MESSAGE_SENT.forEach(x => x(to, msg, msg));
            }
        },

        {
            predicate: msg => msg.__x_type == 'payment',
            handler: function (msg) {
                var sender = msg.__x_sender;
                var chat = msg.__x_from;
                const isPayment = msg.__x_paymentStatus === 3 || msg.__x_paymentStatus === 4;
                if (isPayment) {
                    try {
                        API.listener.ExternalHandlers.MESSAGE_RECEIVED.forEach(x => x(sender, chat, msg));
                    } catch (error) {
                        console.log('isso aqui eh culpa do diegon', error)
                    }
                }
            }
        }
    ];

    /*
    Handles a new incoming message
    */
    this.handle_msg = function (msg) {
        //console.log('handling message: ', msg);
        for (let i = 0; i < handlers.length; i++) {
            if (handlers[i].predicate(msg)) {
                handlers[i].handler(msg);
                return;
            }
        }
    };

};

//-------------------------------------------------------------------------------------------------
// API GERAL (window.api)
//-------------------------------------------------------------------------------------------------

window.API = {};

/*
 * Exception constants.
*/
window.API.Error = {
    OK: true,
    USER_NOT_FOUND: "The specified user ID was not found",
    CHAT_NOT_FOUND: "The specified chat ID was not found",
    GROUP_NOT_FOUND: "The specified group metadata ID was not found",
    USER_NOT_IN_GROUP: "The specified user is not a member of the required group"
}

window.API.listener = new Listener();

/**
 * Returns the contact ID from a given phone number.
 * Only digits in the phone number. Example: "972557267388" and not "(+972) 055-726-7388"
 *
 * @param {*} phone_number
 */
window.API.findContactId = (phone_number) => {
    var result = null;
    (Store.Contact.models || Store.Contact.getModelsArray()).forEach(x => {
        if (x.hasOwnProperty("__x_id") && (x.__x_id.match(/\d+/g) || []).join("") == phone_number) {
            result = x.__x_id;
        }
    });
    return result || null;
}

/**
 * Returns an array of chat ID's that correspond to chats with the parameter in the title.
 *
 * @param {*} title
 */
window.API.findChatIds = (title) => {
    var result = [];
    (Store.Chat.models || Store.Chat.getModelsArray()).forEach(x => {
        if (x.hasOwnProperty("__x_formattedTitle") && ~(x.__x_formattedTitle.indexOf(title))) {
            result.push(x.__x_id);
        }
    });
    return result;
}

/**
 * Retrieves a list of all chats that are not groups.
 *
 * @return {Array} An array of objects containing the chat ID, timestamp, and archive status of each chat.
 */
window.API.getChats = () => {
    var result = [];
    (Store.Chat.models || Store.Chat.getModelsArray()).forEach(x => {
        if (x.__x_isGroup === false)
            result.push({ ...x.__x_id, timestamp: x.__x_t, archive: x.archive });
    });
    return result;
}

/**
 * Adds a user to a group.
 *
 * @param {*} user_id - the ID of the user (NOT the phone number)
 * @param {*} group_id - the ID of the group
 * @param {*} callback - to be invoked after the operation finishes
 */
window.API.addUserToGroup = (user_id, group_id, callback) => {
    var group = Core.group(group_id);
    var user = Core.contact(user_id);

    if (group == null) {
        Core.error(API.Error.GROUP_NOT_FOUND, callback);
        return;
    }
    if (user == null) {
        Core.error(API.Error.USER_NOT_FOUND, callback);
        return;
    }

    group.participants.addParticipant(user).then(callback);
}

/**
 * Removes a user from a group.
 *
 * @param {*} user_id - the ID of the user (NOT the phone number)
 * @param {*} group_id - the ID of the group
 * @param {*} callback - to be invoked after the operation finishes
 */
window.API.removeUserFromGroup = (user_id, group_id, callback) => {
    var group = Core.group(group_id);
    if (group == null) {
        Core.error(API.Error.GROUP_NOT_FOUND, callback);
        return;
    }

    var user = Core.find(group.participants, x => x.hasOwnProperty("__x_id") && x.__x_id == user_id);
    if (user == null) {
        Core.error(API.Error.USER_NOT_IN_GROUP, callback || Core.nop);
        return;
    }

    group.participants.removeParticipant(user).then(callback);
}

/**
 * Sets a chat's archived status
 *
 * @param {*} chat_id - the ID of the conversation
 * @param {*} archive_status - true for archiving, false for unarchiving.
 * @param {*} callback - to be invoked after the operation finishes
 */
window.API.setChatArchiveStatus = (chat_id, archive_status, callback) => {
    var chat = Core.chat(chat_id);
    if (chat == null) {
        Core.error(API.Error.CHAT_NOT_FOUND, callback);
        return;
    }

    Store.ChatUtilsSetArchive.setArchive(chat, !!archive_status);
}

/**
 * Gets the archive status of a chat
 *
 * @param {*} chat_id - the ID of the conversation
 * @returns
 */
window.API.getChatArchiveStatus = (chat_id) => {
    var chat = Core.chat(chat_id);
    if (chat == null) {
        return null;
    }

    return chat.archive;
}

/**
 * Revokes a group's invite link.
 *
 * @param {*} group_id - the ID of the group
 * @param {*} callback - to be invoked after the operation completes
 */
window.API.revokeGroupInviteLink = (group_id, callback) => {
    var group = Core.group(group_id);
    if (group == null) {
        Core.error(Core.Error.GROUP_NOT_FOUND, callback);
        return;
    }

    group.revokeGroupInvite().then(function (e) {
        (callback || Core.nop)({ status: e });
    });
}

/**
 * Sets a user's blocked status
 *
 * @param {*} user_id - the ID of the user to block/unblock
 * @param {*} blocked_status - true - blocked, false - unblocked
 * @param {*} callback - to be invoked after the operation completes
 */
window.API.setBlockedStatus = (user_id, blocked_status, callback) => {
    var user = Core.contact(user_id);
    if (user == null) {
        Core.error(API.Error.USER_NOT_FOUND, callback);
        return;
    }

    user.setBlock(blocked_status).then(function (e) {
        (callback || Core.nop)({ status: e });
    });
}

/**
 * Retrieves the profile picture of a user given their ID.
 *
 * @param {string} id - The ID of the user whose profile picture is to be retrieved.
 * @param {function} callback - The callback function to be called after the profile picture is retrieved.
 */
window.API.getProfilePicFromId = (id, callback) => {
    window.Store.ProfilePicThumb.find(id).then(function (d) {
        if (d.__x_img !== undefined) {
            callback({ success: true, imagem: d.__x_img });
        } else {
            callback({ success: false });
        }
    }, function (e) {
        callback({ success: false });
    })
}

/**
 * ForÃ§o envio de mensagem de texto
 *
 * @param {*} id
 * @param {*} message
 * @param {*} callback
 */
window.API.forceSendMessageToID = (id, message, callback) => {
    try {
        window.API.findJidFromNumber(id).then(contact => {
            if (contact.status === 404) {

                callback({ success: false, message: "Contato nÃ£o encontrado." })
            } else {
                window.API.findChatFromId(contact.jid).then(chat => {
                    chat.sendMessage(message);
                    callback({ success: true })
                }).catch(reject => {
                    console.log(reject)
                    callback({ success: false, message: "Chat nÃ£o encontrado." })
                });
            }
        }).catch((err) => {
            console.log(err)
            callback({ success: false, message: "Chat nÃ£o encontrado." })
        })
    } catch (e) {
        console.log(e)
        callback({ success: false, message: "Chat nÃ£o encontrado.", err: e })
    }
}

/**
 * Envio mensagem de texto
 *
 * @param {*} chat_id
 * @param {*} message_text
 * @param {*} callback
 */
window.API.sendTextMessage = (chat_id, message_text, callback, from) => {
    var chat = Core.chat(chat_id);
    const possibleForceFroms = ["totem", "waiter-temporary-notification"]

    if (chat == null) {
        let isHotnumber = settings?.phone?.hot_number ? true : false;

        if (!isHotnumber) {
            const totalChats = Store.Chat.models || Store.Chat.getModelsArray()
            const chatsWithoutGroups = totalChats.filter(chat => chat.__x_isGroup === false)
            isHotnumber = chatsWithoutGroups.length >= 50
        }

        if (Debug.VERSION >= "2.2224.7" && (isHotnumber || possibleForceFroms.includes(from))){
            window.API.forceSendMessageToID(chat_id, message_text, callback)
        }

        return;
    }

    window.Store.SendTextMsgToChat(chat, message_text).then(function (e) {
        //console.log(e);
        (callback || Core.nop)({ status: e });
    });
}

/**
 * VersÃ£o do whatsapp web
 */
window.API.getVersion = () => {
    return (Debug || {}).VERSION;
}

/**
 * Pego as informaÃ§Ãµes do perfil do usuario conectado
 */
window.API.getMe = () => {
    return window.Store.Conn;
}

/**
 * Pego as informaÃ§Ãµes do perfil do usuario conectado
 */
window.API.getMeComplete = () => {
    const chat = window.API.getMyChatId();
    const store = window.Store.Conn;

    return {
        platform: store?.__x_platform || '',
        name: store?.__x_pushname || '',
        phone: chat.user,
        isLoggedIn: window.WAPI.isLoggedIn()
    }
}

/**
 * Sends a link message to a chat.
 *
 * @param {string} chat_id - The ID of the chat to send the message to.
 * @param {string} message_text - The text of the message to send.
 * @param {boolean} link_preview - Whether to enable link preview for the message.
 * @param {function} callback - The callback function to be called after the message is sent.
 * @return {Promise} A Promise that resolves when the message is sent successfully.
 */
window.API.sendLinkMessage = (chat_id, message_text, link_preview, callback) => {
    var chat = Core.chat(chat_id);

    if (chat == null) {
        Core.error(API.Error.CHAT_NOT_FOUND, callback)
        return;
    }

    window.Store.SendTextMsgToChat(chat, message_text, { linkPreview: link_preview }).then(function (e) {
        console.log(e);
        (callback || Core.nop)({ status: e });
    });
}

/**
 * Sends an image message to a chat.
 *
 * @param {string} chat_id - The ID of the chat to send the message to.
 * @param {Object} imageUrl - The URL of the image to send.
 * @param {string} caption - The caption of the image.
 * @param {Function} callback - The callback function to be called after the message is sent.
 * @return {Promise<void>} A promise that resolves when the message is sent successfully, or rejects with an error.
 */
window.API.sendImageMessage = async (chat_id, imageUrl, caption, callback) => {
    try {
        let chat = Store.Chat.get(chat_id);
        if (!chat) chat = await API.firstContact(chat_id);
        if (!chat) {
            console.log('nao existe chat');
        };

        let image = imageUrl.base64Img;

        const mediaBlob = API.base64ImageToFile(image, "imagem", imageUrl.contentType);

        if (chat) {
            var mc = new Store.MediaCollection(chat);
            mc.processAttachments(
                [{
                    file: mediaBlob
                }],
                1,
                chat
            )
                .then(() => {
                    var media = (mc.models || mc.getModelsArray())[0];
                    media.sendToChat(chat, {
                        caption: caption,
                    });
                    callback();
                })
                .catch(e => console.log("Aqui o erro fi", e))
        } else {
            console.log('nao existe chat')
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * Opens a chat using the provided chat object and message.
 *
 * @param {Object} chat - The chat object to open.
 * @param {string} msg - The message to send in the chat.
 */
window.API.openChat = (chat, msg) => {
    window.Store.Cmd.openChatAt(chat);

    if(msg) {
        window.API.sendTextMessage(chat.id._serialized, msg, function () {
            console.log("Mensagem enviada: ", msg);
        }, 'anota-ai-desktop');
    }
}

/**
 * Opens a chat by the given phone number and sends a message.
 *
 * @param {string} number - The phone number of the chat to open.
 * @param {string} msg - The message to send in the chat.
 * @return {Promise<void>} - A Promise that resolves when the chat is opened and the message is sent.
 */
window.API.openChatByNumber = async (number, msg) => {
    let jid = await window.API.findJidFromNumber(number)
    if (jid.status !== 200) {
        console.error("chat not found")
        return
    }
    let chat = await window.API.findChatFromId(jid.jid)
    API.openChat(chat, msg)
}

/**
 * Converts a base64 image to a File object.
 *
 * @param {string} base64Img - The base64 encoded image.
 * @param {string} filename - The name of the file.
 * @param {string} contentType - The MIME type of the file.
 * @return {File} The File object representing the base64 image.
 */
window.API.base64ImageToFile = (base64Img, filename, contentType) => {
    const byteCharacters = atob(base64Img);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    return new File([blob], filename, { type: contentType });
}

/**
 * Sends a seen status to a chat.
 *
 * @param {string} chat_id - The ID of the chat.
 * @param {function} [callback] - Optional callback function to handle the response.
 */
window.API.sendSeen = (chat_id, callback) =>{
    var chat = Core.chat(chat_id);
    if (chat == null) {
        Core.error(API.Error.CHAT_NOT_FOUND, callback)
        return;
    }

    window.Store.PresenceUtils.sendPresenceAvailable()
    window.Store.SendSeen(chat, false).then(function (e) {
        (callback || Core.nop)({ status: e });
    });

    const newId = window.Store.WidFactory.createWid(chat_id)
    window.Store.ChatState.sendChatStateComposing(newId)
}

/**
 * Retrieves contact info for a certain id
 *
 * @param {*} user_id  - the id of the user to look for
 */
window.API.getContactInfo = (user_id) => {
    var contact = Core.contact(user_id);
    if (contact == null || !contact["all"]) {
        return null;
    }

    return contact.all;
}

/**
 * Retrieves message info for a certain id
 *
 * @param {*} message_id - the id of the message to look for
 */
window.API.getMessageInfo = (message_id) => {
    return Core.find((Store.Msg.models || Store.Msg.getModelsArray()), x => x.__x_id._serialized == message_id);
}

/**
 * Returns a list of all contact IDs.
 *
 * @return {array} - the array of strings containing the IDs of the clients.
 */
window.API.getContactList = () => {
    var result = [];
    (Store.Contact.models || Store.Contact.getModelsArray()).forEach(x => { result.push(x.__x_id); });
    return result;
}

/**
 * Sends contact(s) to a chat.
 *
 * @param {*} chat_id - the ID of the chat to write the contacts to
 * @param {*} contacts - the contact / array of contacts to send
 * @param {*} callback - to be incoked after the operation completes
 */
window.API.sendContactMessage = (chat_id, contacts, callback) =>{
    if (contacts.constructor != Array) {
        contacts = [contacts];
    }

    var chat = Core.chat(chat_id);
    if (chat == null) {
        Core.error(API.Error.CHAT_NOT_FOUND, callback);
        return;
    }

    var toSend = [];
    contacts.forEach(x => {
        var c = Core.contact(x);
        if (c != null) {
            toSend.push(c);
        }
    });

    if (!toSend.length) {
        Core.error(API.Error.USER_NOT_FOUND, callback);
        return;
    }

    if (toSend.length == 1) {
        chat.sendContact(toSend[0]);
    }
    else {
        chat.sendContactList(toSend);
    }
}

/**
 * Send the other side "<you> is typing..."
 *
 * @param {*} chat_id - the chat id
 */
window.API.sendTyping = (chat_id) => {
    var chat = Core.chat(chat_id);
    if (chat == null) {
        return API.Error.CHAT_NOT_FOUND;
    }

    chat.markComposing();
}

/**
 * Pego conversa atualmente aberta
 */
window.API.getActiveTab = () => {
    var activeTab = Core.activeTab();
    return activeTab;
}

/**
 * Send the other side "<you> is recording audio..."
 *
 * @param {*} chat_id - the chat id
 */
window.API.sendRecording = (chat_id) => {
    var chat = Core.chat(chat_id);
    if (chat == null) {
        return API.Error.CHAT_NOT_FOUND;
    }

    chat.markRecording();
}

/**
 * Hides the "<you> is recording audio..." to the other side
 *
 * @param {*} chat_id - the chat id
 */
window.API.sendStopRecording = (chat_id) => {
    var chat = Core.chat(chat_id);
    if (chat == null) {
        return API.Error.CHAT_NOT_FOUND;
    }

    chat.markPaused();
}

/**
 * Initializes a group (required to call before interacting with a group).
 *
 * @param {*} group_id
 * @param {*} callback
 */
window.API.initGroup = (group_id, callback) => {
    var group = Core.group(group_id);
    if (group == null) {
        return API.Error.GROUP_NOT_FOUND;
    }

    group.update().then(callback);
}

/**
 * Minimizes a message object to a JSON convertable object for sending over network (smaller size than a huge Msg object)
 *
 * @param {*} msg_object
 */
window.API.parseMsgObject = (msg_object) => {
    var m = msg_object.all;
    if (msg_object["__x__quotedMsgObj"]) {
        m.quotedMsg = API.parseMsgObject(Core.msg(msg_object.__x__quotedMsgObj.__x_id._serialized));
    }
    m.chat = m.chat.all;
    delete m.msgChunk;
    return m;
}

/**
 * Finds a chat by its ID.
 *
 * @param {string} id - The ID of the chat to find.
 * @return {Object} The found chat object.
 */
window.API.findChatFromId = (id) => {
    try {
        console.log('findChatFromId: ', id);
        const wid = window.Store.WidFactory.createWid(id);
        return window.Store.Chat.find(wid);
    } catch (error) {
        console.error('error findChatFromId: ', error);
        return null;
    }
}

/**
 * Checks if the current version of the API supports multi-device functionality.
 *
 * @return {boolean} Returns true if the API supports multi-device functionality, false otherwise.
 */
window.API.isMultiDeviceVersion = function () {
    return Store.MdCheck.isMDBackend();
}

/**
 * Finds the phone number after sanitizing the number.
 *
 * @param {string} number - The phone number to find the JID for.
 * @return {Object} An object containing the status and JID value.
 */
window.API.findJidFromNumber = (number) => {
    number = number.replace("@c.us", "").replace("+", "");
    return Store.QueryExist.queryExist({ type: "phone", phone: number }).then(value => {
        return {
            status: 200,
            jid: value.wid
        }
    })
}

/**
 * Processes a media message by downloading or getting the blob and converting it to base64.
 *
 * @param {Object} msg - The media message object.
 * @param {number} maxTime - The maximum time to wait for the media to be resolved.
 * @return {Promise<string|Blob>} A promise that resolves with the base64 string or the blob if found, or rejects with an error if not found or media not resolved.
 */
window.API.processMediaMessage = (msg, maxTime) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!msg) {
                reject(new Error("Msg is null"));
            } else {
                console.log("Initializing download of msgInitializing download of msg: ", msg.id);
                if (msg.chat && !msg.chat.notSpam)
                    msg.chat.notSpam = true;
                let result = await window.API.downloadOrGetBlob(msg, maxTime, false);
                if (result) {
                    console.log("Converting blob to base64 in msg: ", msg.id)
                    let base64 = await window.API.readFileAsync(result);
                    resolve(base64.split(',')[1]);
                    resolve(result);
                } else {
                    reject(new Error(`MediaNotFound (${msg.id})`));
                }
            }
        } catch (e) {
            reject(e);
            console.error(`DownloadOrGetBlob (${msg.id})`, e);
        }
    });
}

/**
 * Downloads or retrieves a blob from the Store.BlobCache based on the given message.
 *
 * @param {Object} msg - The message object containing the filehash.
 * @param {number} maxTime - The maximum time to wait for the media to be resolved.
 * @param {boolean} isRecursive - Indicates whether the function is called recursively.
 * @return {Promise<Blob>} A promise that resolves to the blob if found, or throws an error if not found or media not resolved.
 */
window.API.downloadOrGetBlob = async (msg, maxTime, isRecursive) => {
    let blob = Store.BlobCache.get(msg.filehash);
    if (blob) {
        return blob;
    } else {
        if (msg.mediaData.mediaStage === "NEED_POKE") {
            await msg.forceDownloadMediaEvenIfExpensive();
        } else {
            await msg.downloadMedia({
                downloadEvenIfExpensive: 1,
                rmrReason: 1,
                isUserInitiated: 0,
                isAutoDownload: 0
            });
        }

        if (msg.mediaData.mediaStage !== 'RESOLVED') {
            if (!isRecursive) {
                throw new Error(`Media not resolved (${msg.id} - ${msg.mediaData.mediaStage})`);
            }
            console.log("MediaStage not resolved, listening to changes to try download with timeout: ", maxTime);
            return await new Promise((resolve, reject) => {
                let mediaChanged = async (e) => {
                    if (e.mediaStage === 'RESOLVED' || e.mediaStage === 'NEED_POKE') {
                        resolve(await window.API.downloadOrGetBlob(msg, true));
                    }
                    msg.mediaData.off("change:mediaStage");
                }
                msg.mediaData.on("change:mediaStage", mediaChanged);
                setTimeout(() => {
                    reject(new Error("Timeout waiting mediaStage RESOLVED. Current state: " + msg.mediaData.mediaStage));
                    msg.mediaData.off("change:mediaStage");
                }, maxTime);
            });
        }

        if (msg.mediaData.mediaBlob) {
            return msg.mediaData.mediaBlob.forceToBlob();
        }
        return Store.BlobCache.get(msg.filehash);
    }
}

/**
 * Reads a file asynchronously and returns a Promise that resolves with the result.
 *
 * @param {File} file - The file to be read.
 * @return {Promise<string>} A Promise that resolves with the result of reading the file as a data URL.
 */
window.API.readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    })
};

/**
 * Crop and resize an image based on the provided media and options.
 *
 * @param {Object} media - The media object containing image data.
 * @param {Object} options - The options for cropping and resizing the image.
 * @return {Object|string} The cropped and resized image data or data URL.
 */
window.API.cropAndResizeImage = async (media, options = {}) => {
    if (!media.mimetype.includes('image'))
        throw new Error('Media is not an image');

    if (options.mimetype && !options.mimetype.includes('image'))
        delete options.mimetype;

    options = Object.assign({ size: 640, mimetype: media.mimetype, quality: .75, asDataUrl: false }, options);

    const img = await new Promise ((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:${media.mimetype};base64,${media.data}`;
    });

    const sl = Math.min(img.width, img.height);
    const sx = Math.floor((img.width - sl) / 2);
    const sy = Math.floor((img.height - sl) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = options.size;
    canvas.height = options.size;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sl, sl, 0, 0, options.size, options.size);

    const dataUrl = canvas.toDataURL(options.mimetype, options.quality);

    if (options.asDataUrl)
        return dataUrl;

    return Object.assign(media, {
        mimetype: options.mimeType,
        data: dataUrl.replace(`data:${options.mimeType};base64,`, '')
    });
};

/**
 * Pego as informaÃ§Ãµes dos estados do whatsapp, sync e outros
 *
 * @returns {Object}
 */
window.API.getState = () => {
    return Store.Socket;
};

/**
 * Valido se nÃºmero possui whatsapp
 *
 * @param {string} number - The phone number to be validated.
 * @return {Object} An object containing the validation status and the number if valid, or an error status if invalid.
 */
window.API.validateNumber = async (number) => {
    const sanitizedNumber = number.replace("@c.us", "").replace("+", "");

    try {
        const response = await Store.QueryExist.queryExist({ type: "phone", phone: sanitizedNumber });

        if (response?.wid?.user) {
            return { status: 200, number: response.wid.user };
        } else {
            return { status: 404 };
        }
    } catch (e) {
        console.error(`Failed to validate number ${sanitizedNumber}: ${e.message}`)
        return { status: 500 }
    }
}

/**
 * Retrieves the chat ID associated with the current user.
 *
 * @return {Object} The chat ID of the current user.
 */
window.API.getMyChatId = () => {
    return Store.GetMaybeMeUser.getMaybeMeUser();
}

/**
 * Checks if the user is logged in.
 *
 * @return {boolean} Returns true if the user is logged in, false otherwise.
 */
window.API.isLoggedIn = () => {
    return (Store.Socket.__x_state === 'CONNECTED') ? true : false;
}

/**
 * Retrieves information about the WhatsApp account.
 */
window.API.getInfoWhatsapp = () => {
    const chat = window.API.getMyChatId();
    const store = window.Store.Conn;

    return {
        platform: store?.__x_platform || '',
        name_whatsapp: store?.__x_pushname || '',
        phone_merchant: chat.user,
        is_logged_in: window.API.isLoggedIn(),
        whatsapp_version: window.API.getVersion(),
    }
}

/**
 * Retrieves chat statistics including total conversations, archive count, non-archive count, and chat activity over different time periods.
 *
 * @return {Object} Object containing total conversations, archive count, non-archive count, and chat activity over different time periods
 */
window.API.getChatStatistic = () => {
    let chats = window.API.getChats();

    const oneDayInMilliseconds = 86400000 / 1000;
    const sevenDaysInMilliseconds = 604800000 / 1000;
    const thirtyDaysInMilliseconds = 2592000000 / 1000;
    const sixtyDaysInMilliseconds = 5184000000 / 1000;

    const totalConversations = chats.length;
    const totalArchive = chats.filter(item => item.archive).length;
    const chastsNoArchive = chats.filter(item => !item.archive);
    const totalNoArchive = chastsNoArchive.length;

    const actualDateInTimeStamp = new Date().getTime() / 1000;
    const filteredDataOneDay = chats.filter(item => new Date(actualDateInTimeStamp - oneDayInMilliseconds).getTime() < item.timestamp);
    const filteredDataSevenDays = chats.filter(item => new Date(actualDateInTimeStamp - sevenDaysInMilliseconds).getTime() < item.timestamp);
    const filteredDataThirtyDays = chats.filter(item => new Date(actualDateInTimeStamp - thirtyDaysInMilliseconds).getTime() < item.timestamp);
    const filteredDataSixtyDays = chats.filter(item => new Date(actualDateInTimeStamp - sixtyDaysInMilliseconds).getTime() < item.timestamp);

    return {
        total_conversations: totalConversations,
        total_archive: totalArchive,
        total_no_archive: totalNoArchive,
        daily_total_chats: filteredDataOneDay.length,
        weekly_total_chats: filteredDataSevenDays.length,
        monthly_total_chats: filteredDataThirtyDays.length,
        sixty_days_chats: filteredDataSixtyDays,
    }
}

/**
 * Creates a base message object with the given ID and recipient.
 *
 * @param {string} id - The ID of the message.
 * @param {string} to - The recipient of the message.
 */
window.API.createBaseMsg = (id, to) => {
    return {
        t: Store.GlobalUnixTime.unixTime(),
        from: Store.GetMaybeMeUser.getMaybeMeUser(),
        isNewMsg: !0,
        to: to,
        self: "out",
        type: "unknown",
        ack: 0,
        local: !0,
        id: id
    };
};

/**
 * Converts an image to a data URI.
 *
 * @param {string} imgBase64 - The base64 encoded image.
 * @param {number} width - The width of the canvas.
 * @param {number} height - The height of the canvas.
 * @param {string} type - The type of the image (default is 'image/jpeg').
 * @return {string} The data URI of the converted image.
 */
window.API.imageToDataUri = async (imgBase64, width, height, type = 'image/jpeg') => {

    let img = await API.base64ImageToImageObj(imgBase64);

    // create an off-screen canvas
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    // set its dimension to target size
    canvas.width = width;
    canvas.height = height;

    // draw source image into the off-screen canvas:
    ctx.drawImage(img, 0, 0, width, height);

    // encode image to data-uri with base64 version of compressed image
    return canvas.toDataURL(type);
};

/**
 * Converts a base64 encoded image to an Image object.
 *
 * @param {string} imgBase64 - The base64 encoded image.
 * @return {Promise<Image>} A promise that resolves with the Image object.
 */
window.API.base64ImageToImageObj = function (imgBase64) {
    return new Promise((resolve, reject) => {
        let img = new Image;
        img.onload = () => {
            resolve(img);
        };
        img.src = imgBase64;
    });
};

/**
 * Builds media data for the given base64 image data.
 *
 * @param {string} base64 - The base64 encoded image data.
 * @param {string} filename - The name of the file.
 * @param {boolean} forceDocument - Flag to indicate if it should be treated as a document.
 * @param {object} stickerSendData - Data related to sending stickers.
 * @return {object} The constructed media data.
 */
window.API.buildMediaData = async (base64, filename, forceDocument, stickerSendData) => {
    let file = null;
    if (stickerSendData) {
        base64 = await API.imageToDataUri(base64, 512, 512, 'image/webp');
        file = API.urlToFile(base64, 'sticker.webp');
        let originalBuffer = await file.arrayBuffer();
        let stickerData = {
            isFirstParty: false,
            isFromStickerMaker: false,
            stickerPackPublisher: stickerSendData.collectionName,
            stickerPackName: stickerSendData.stickerName
        };
        let buffer = await Store.AddWebpMetadata.addWebpMetadata(originalBuffer, stickerData);
        file = new Blob([buffer]);
    } else {
        file = API.urlToFile(base64, filename);
    }
    const mData = await Store.DataFactory.createFromData(file, file.type);
    const mediaPrep = Store.MediaPrep.prepRawMedia(mData, { asDocument: forceDocument });
    const mediaData = await mediaPrep.waitForPrep();
    const mediaObject = Store.MediaObject.getOrCreateMediaObject(mediaData.filehash);

    if (stickerSendData) {
        mediaData.type = 'sticker';
    }

    const mediaType = Store.MsgToMediaType.msgToMediaType({
        type: mediaData.type,
        isGif: mediaData.isGif
    });

    if (filename?.includes('.ptt') && mediaData.type === 'audio') {
        mediaData.type = 'ptt';
    } else if (filename?.includes('.gif') && mediaData.type === 'video') {
        mediaData.isGif = true;
    } else if (forceDocument) {
        mediaData.type = 'document';
    }

    if (!(mediaData.mediaBlob instanceof Store.DataFactory)) {
        mediaData.mediaBlob = await Store.DataFactory.createFromData(mediaData.mediaBlob, mediaData.mediaBlob.type);
    }

    mediaData.renderableUrl = mediaData.mediaBlob.url();
    mediaObject.consolidate(mediaData.toJSON());
    mediaData.mediaBlob.autorelease();

    const uploadedMedia = await Store.MediaUpload.uploadMedia({
        mimetype: mediaData.mimetype,
        mediaObject,
        mediaType
    });

    const mediaEntry = uploadedMedia.mediaEntry;
    if (!mediaEntry) {
        throw new Error('upload failed: media entry was not created');
    }

    mediaData.set({
        clientUrl: mediaEntry.mmsUrl,
        deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
        directPath: mediaEntry.directPath,
        mediaKey: mediaEntry.mediaKey,
        mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
        filehash: mediaObject.filehash,
        encFilehash: mediaEntry.encFilehash,
        uploadhash: mediaEntry.uploadHash,
        size: mediaObject.size,
        streamingSidecar: mediaEntry.sidecar,
        firstFrameSidecar: mediaEntry.firstFrameSidecar
    });

    return mediaData;
};

/**
 * Converts a base64 image to a File object.
 *
 * @param {string} b64Data - The base64 encoded image data.
 * @param {string} filename - The name of the file.
 * @return {File} The File object representing the base64 image.
 */
window.API.urlToFile = function (b64Data, filename) {
    let arr = b64Data.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

/**
 * Pego o chat de primeiro contato
 *
 * @param {String} id
 */
window.API.firstContact = async (id) => {
    const contact = await window.API.findJidFromNumber(id);
    if (contact.status === 404) return false;

    return await window.API.findChatFromId(contact.jid);
}

/**
 * Sends an image message in a chat.
 *
 * @param {Chat} chat - The chat to send the message to.
 * @param {string} url - The URL of the image to send.
 * @param {string} caption - The caption for the image message.
 * @param {object} stickerData - The sticker data for the image.
 * @return {Promise} A promise that resolves with the sent message.
 */
window.API.sendImageMessageNew = async (chat, url, caption, stickerData) => {
    try {
        const mountObj = {
            media: {
                data: await convertToBase64(url),
                filename: `image-${API.getNewId()}`,
                forceDocument: false,
                stickerData
            }
        }

        const chatResult = Store.Chat.get(chat);
        if (chatResult) chat = chatResult;

        return await chat.sendMessage(caption ?? null, mountObj);
    } catch (error) {
        console.log('Error send image message', error);
    }
}

/**
 * Sends a batch of messages to a specific sender.
 *
 * @param {Array} messagesInfo - An array of messages to be sent.
 * @param {string} senderId - The ID of the sender.
 * @return {boolean} - Returns true if the messages were sent successfully, false otherwise.
 */
window.API.mainSendMessage = async (infos) => {
    try {
        const { senderId, arrayMessage } = infos;
        let chat = Store.Chat.get(senderId);
        if (!chat) chat = await API.firstContact(senderId);
        if (!chat) return;

        for (const message of arrayMessage) {
            API.sendSeen(senderId);
            await new Promise(resolve => setTimeout(resolve, 900));

            if (message?.type === 'image') {
                await API.sendImageMessageNew(chat, message.content, message?.caption, message?.stickerData);

            } else {
                if (message?.content && typeof message.content === 'string') await chat.sendMessage(message.content);
            }
        }

    } catch (error) {
        console.log('Error send messages', error);
    }
}

//-------------------------------------------------------------------------------------------------
// GRUPOS e COMUNIDADES
//-------------------------------------------------------------------------------------------------

/**
 * Sets a profile picture for a chat group.
 *
 * @param {string} chatid - The ID of the chat.
 * @param {Object} media - The media object containing the image.
 * @return {Promise<boolean>} A promise that resolves to true if the profile picture was set successfully, or false otherwise.
 */
window.API.groupSetPicture = async (chatid, media) => {
    try {
        const thumbnail = await window.API.cropAndResizeImage(media, { asDataUrl: true, mimetype: 'image/jpeg', size: 96 });
        const profilePic = await window.API.cropAndResizeImage(media, { asDataUrl: true, mimetype: 'image/jpeg', size: 640 });
        const chatWid = window.Store.WidFactory.createWid(chatid);

        const res = await window.Store.GroupUtils.sendSetPicture(chatWid, thumbnail, profilePic);
        return res ? res.status === 200 : false;
    } catch (err) {
        console.log('Error in setPicture', err);
        return false;
    }
};

/**
 * Retrieves the invite code for a specific group chat.
 *
 * @param {string} chatIdGroup - The ID of the group chat.
 * @param {boolean} log - Whether to log the error or not.
 * @return {Object} An object containing the status, code, and link of the group invite.
 */
window.API.getInviteCodeGroup = async (chatIdGroup, log = true) => {
    try {
        const chatIdOrigin = window.API.getMyChatId()._serialized;
        const chatWid = window.Store.WidFactory.createWid(chatIdGroup);
        const chatWidOrigin = window.Store.WidFactory.createWid(chatIdOrigin);
        const codeRes = await window.Store.GroupInvite.queryGroupInviteCode(chatWid, chatWidOrigin);

        return {
            status: true,
            code: codeRes?.code ?? "",
            link: `https://chat.whatsapp.com/${codeRes?.code}`,
        }

    } catch (error) {
        if(log) console.log('Error getInviteCodeGroup', error);

        return {
            status: false
        }
    }
}

/**
 * Retrieves an array of groups from the Store.Chat.
 *
 * @return {Promise<Object>} An object containing the status and groups properties.
 */
window.API.getGroups = async () => {
    try {
        const chatIdOrigin = window.API.getMyChatId()._serialized;
        const groupPromises  = await Store.Chat.getModelsArray().filter(chat => chat.isGroup).map(async chat => {

            const isAdmin = chatIdOrigin === chat.groupMetadata?.attributes?.owner?._serialized ? true : false;

            return {
                id: chat.id._serialized,
                name: chat.name ? chat.name : chat?.groupMetadata?.subject,
                isReadOnly: chat.isReadOnly,
                archive: chat.archive,
                isBusinessGroup: chat.isBusinessGroup,
                isCommunity: chat.isParentGroup === true ? true : false,
                isAdmin,
            }
        });

        let groups = await Promise.all(groupPromises);

        return {
            status: true,
            groups
        };

    } catch (error) {
        console.log('Error in getGroups', error);
        return { status: false };
    }
}

/**
 * Retrieves a group by its name asynchronously.
 *
 * @param {string} name - The name of the group to search for.
 * @return {Promise<Object>} An object containing the status of the operation, the group title, and the community ID if found.
 */
window.API.getGroupByName = async (name) => {
    try {
        const chatIdOrigin = window.API.getMyChatId()._serialized;

        let chat = await Store.Chat.getModelsArray().filter(chat => {
            const isAdmin = chatIdOrigin === chat.groupMetadata?.attributes?.owner?._serialized ? true : false;
            return chat.isGroup && chat.isParentGroup === false && chat.groupMetadata?.subject === name && chat.groupMetadata?.groupType == 'LINKED_SUBGROUP' && isAdmin
        });

        if(!chat || chat.length === 0) return {
            status: false,
            message: "Chat not found"
        };

        chat = chat[0];

        return {
            status: true,
            title: name,
            idGroup: chat.id._serialized
        };

    } catch (error) {
        console.log('Error in getGroupByName', error);
        return {
            status: false,
            message: "Error in getGroupByName"
        };
    }
}

/**
 * Retrieves a community by its name.
 *
 * @param {string} name - The name of the community.
 * @return {Promise<Object>} A promise that resolves to an object containing the status, title, and idCommunity of the community. If the community is not found, the status will be false and the message will contain the error message.
 */
window.API.getCommunityByName = async (name) => {
    try {
        const chatIdOrigin = window.API.getMyChatId()._serialized;

        let chat = await Store.Chat.getModelsArray().filter(chat => {
            const isAdmin = chatIdOrigin === chat.groupMetadata?.attributes?.owner?._serialized ? true : false;
            return chat.isGroup && chat.isParentGroup === true && chat.groupMetadata?.subject === name && isAdmin
        });

        if(!chat || chat.length === 0) return {
            status: false,
            message: "Chat not found"
        };

        chat = chat[0];

        return {
            status: true,
            title: name,
            idCommunity: chat.id._serialized,
        };

    } catch (error) {
        console.log('Error in getCommunityByName', error);
        return {
            status: false,
            message: "Error in getCommunityByName"
        };
    }
}

/**
 * Sets the admin-only flag for a group chat.
 *
 * @param {string} chatIdGroup - The ID of the group chat.
 * @param {boolean} adminsOnly - Whether to restrict the group to admins only. Defaults to true.
 * @return {Promise<{ status: boolean }>} An object indicating the status of the operation.
 */
window.API.groupSetInfoAdminOnly = async (chatIdGroup, adminsOnly = true) => {
    try {
        const chatWid = window.Store.WidFactory.createWid(chatIdGroup);
        await window.Store.GroupUtils.setGroupProperty(chatWid, 'restrict', adminsOnly ? 1 : 0);

        return { status: true };
    } catch (error) {
        console.log('Error in groupSetInfoAdminOnly', error);
        return { status: false };
    }
}

/**
 * Sets the group's messages to be accessible only by admins.
 *
 * @param {string} chatIdGroup - The ID of the group chat.
 * @param {boolean} [adminsOnly=true] - Whether to restrict the group's messages to admins only.
 * @return {Promise<{ status: boolean }>} - A promise that resolves to an object indicating the status of the operation.
 */
window.API.groupSetMessagesAdminsOnly = async (chatIdGroup, adminsOnly = true) => {
    try {
        const chatWid = window.Store.WidFactory.createWid(chatIdGroup);
        await window.Store.GroupUtils.setGroupProperty(chatWid, 'announcement', adminsOnly ? 1 : 0);

        return { status: true };
    } catch (err) {
        console.log('Error in groupSetMessagesAdminsOnly', error);
        return { status: false };
    }
}

/**
 * Asynchronously leaves a group with the specified chat ID.
 *
 * @param {string} chatIdGroup - The ID of the chat representing the group to leave.
 * @return {Promise<Object>} An object with a `status` property indicating success or failure and a `data` property containing the result of the `sendExitGroup` function if successful.
 */
window.API.groupLeave = async (chatIdGroup) => {
    try {
        const chatWid = window.Store.WidFactory.createWid(chatIdGroup);
        const chat = await window.Store.Chat.find(chatWid);
        await window.Store.GroupUtils.sendExitGroup(chat);
        await window.Store.sendDelete(chat);
        console.log('Group deleted: ', chatIdGroup);

        return { status: true }
    } catch (error) {
        console.log('Error in groupLeave', error);
        return { status: false };
    }
}

/**
 * Creates a new group with the specified title and participants.
 *
 * @param {string} title - The title of the group.
 * @param {Object} media - The media object for the group.
 * @param {Object} options - Additional options for creating the group.
 * @return {Promise<{ status: boolean }} An object containing the status of the operation, group title, group ID, and participant data.
 */
window.API.createGroup = async (title, media, options = {}) => {
    try {
        const { messageTimer = 0, parentGroupId } = options;
        let createGroupResult, parentGroupWid;

        parentGroupId && (parentGroupWid = window.Store.WidFactory.createWid(parentGroupId));

        const groupExist = await window.API.getGroupByName(title);
        if(groupExist.status) console.log('Group already exists', groupExist);

        if(!groupExist.status) {
            createGroupResult = await window.Store.GroupUtils.createGroup(
                {
                    'memberAddMode': options.memberAddMode === undefined ? false : options.memberAddMode,
                    'membershipApprovalMode': options.membershipApprovalMode === undefined ? false : options.membershipApprovalMode,
                    'announce': options.announce === undefined ? true : options.announce,
                    'ephemeralDuration': messageTimer,
                    'full': undefined,
                    'parentGroupId': parentGroupWid,
                    'restrict': options.restrict === undefined ? true : options.restrict,
                    'thumb': undefined,
                    'title': title,
                },
                []
            );
        }

        const idGroup = !groupExist.status ? createGroupResult.wid?._serialized : groupExist.idGroup;

        await delay(1000);
        let inviteResponse = await window.API.getInviteCodeGroup(idGroup);

        if(!inviteResponse.status) {
            await delay(5000);
            inviteResponse = await window.API.getInviteCodeGroup(idGroup);
        }

        if(!inviteResponse.status) {
            console.log('CreateGroupError: invite code not found');
            return { status: false, message: 'Group invite code not found' };
        }
        const { code, link } = inviteResponse;

        await window.API.groupSetInfoAdminOnly(idGroup);
        await window.API.groupSetMessagesAdminsOnly(idGroup);
        if(media && !groupExist.status) await window.API.groupSetPicture(idGroup, media);

        return {
            status: true,
            title: title,
            idGroup,
            codeInvite: {
                code,
                link
            },
        };

    } catch (err) {
        console.log('CreateGroupError general:', err);
        return { status: false, message: 'CreateGroupError general' };
    }
}

/**
 * Crio grupo e comunidade
 *
 * @param {String} title
 * @returns
 */
window.API.createGroupAndCommunity = async (title, media) => {
    try {
        const group = await window.API.createGroup(title, media);
        console.log('createGroupAndCommunity createGroup...', group);

        if(!group.status) return { status: false, message: group?.message || 'Error in createGroup' };

        const community = await window.API.createCommunity(title, media, {
            description: '',
            subGroupIds: [group.idGroup],
            membershipApprovalMode: false,
            allowNonAdminSubGroupCreation: false
        });
        console.log('createGroupAndCommunity createCommunity...', group);

        if(!community.status) {
            await window.API.groupLeave(group.idGroup);
            return { status: false, message: community?.message || 'Error in createCommunity' };
        }

        return {
            status: true,
            title: title,
            idGroup: group.idGroup,
            idCommunity: community.idCommunity,
            codeInvite: group.codeInvite.code
        };

    } catch (error) {
        console.log('Error in createGroupAndCommunity', error);
        return { status: false, message: 'Error in createGroupAndCommunity' };
    }
}

/**
 * Crio comunidade
 *
 * @param {String} name
 * @param {Object} media
 * @param {Object} options
 * @returns
 */
window.API.createCommunity = async (name, media, options = {}) => {
    try {
        let {
            description: desc = '',
            subGroupIds = null,
            membershipApprovalMode: closed = true,
            allowNonAdminSubGroupCreation: hasAllowNonAdminSubGroupCreation = false
        } = options;

        let createCommunityResult, linkingSubGroupsResult;

        const communityExist = await window.API.getCommunityByName(name);
        if(communityExist.status) console.log('Community already exists', communityExist);

        if(!communityExist.status) {
            createCommunityResult = await window.Store.CommunityUtils.sendCreateCommunity({
                name,
                desc,
                closed,
                hasAllowNonAdminSubGroupCreation
            });
        }

        const idCommunity = !communityExist.status ? createCommunityResult.wid._serialized : communityExist.idCommunity;

        if (!communityExist.status && subGroupIds) {
            linkingSubGroupsResult = await window.API.linkUnlinkSubgroups(
                'LinkSubgroups',
                idCommunity,
                subGroupIds
            );
        }

        if(media && !communityExist.status) await window.API.groupSetPicture(idCommunity, media);

        return {
            status: true,
            title: name,
            idCommunity
        };

    } catch (err) {
        console.log('CreateCommunityError general:', err);
        return { status: false, message: 'CreateCommunityError general' };
    }
}

/**
 * Links or unlinks subgroups to/from a parent group.
 *
 * @param {string} action - The action to perform, either 'LinkSubgroups' or 'UnlinkSubgroups'.
 * @param {string} parentGroupId - The ID of the parent group.
 * @param {Array<string>|string} subGroupIds - The IDs of the subgroups to link or unlink. Can be a single string or an array of strings.
 * @param {Object} [options={}] - Additional options.
 * @param {boolean} [options.removeOrphanMembers=false] - Whether to remove orphan members when unlinking subgroups.
 * @return {Promise<Object>} - An object containing the result of the operation.
 * @throws {Error} - If an error occurs during the operation.
 */
window.API.linkUnlinkSubgroups = async (action, parentGroupId, subGroupIds, options = {}) => {
    try {
        !Array.isArray(subGroupIds) && (subGroupIds = [subGroupIds]);
        const { removeOrphanMembers = false } = options;
        const parentGroupWid = window.Store.WidFactory.createWid(parentGroupId);
        const subGroupWids = subGroupIds.map((s) => window.Store.WidFactory.createWid(s));
        const isLinking = action === 'LinkSubgroups';
        let result;

        result = isLinking
            ? await window.Store.CommunityUtils.sendLinkSubgroups({
                parentGroupId: parentGroupWid,
                subgroupIds: subGroupWids
            })
            : await window.Store.CommunityUtils.sendUnlinkSubgroups({
                parentGroupId: parentGroupWid,
                subgroupIds: subGroupWids,
                removeOrphanMembers: removeOrphanMembers
            });

        const errorCodes = {
            default: `An unknown error occupied while ${isLinking ? 'linking' : 'unlinking'} the group ${isLinking ? 'to' : 'from'} the comunity`,
            401: 'SubGroupNotAuthorizedError',
            403: 'SubGroupForbiddenError',
            404: 'SubGroupNotExistError',
            406: 'SubGroupNotAcceptableError',
            409: 'SubGroupConflictError',
            419: 'SubGroupResourceLimitError',
            500: 'SubGroupServerError'
        };

        result = {
            ...(isLinking
                ? { linkedGroupIds: result.linkedGroupJids }
                : { unlinkedGroupIds: result.unlinkedGroupJids }),
            failedGroups: result.failedGroups.map(group => ({
                groupId: group.jid,
                code: +group.error,
                message: errorCodes[group.error] || errorCodes.default
            }))
        };

        return result;
    } catch (err) {
        console.log('linkUnlinkSubgroups error', err);
        if (err.name === 'ServerStatusCodeError') return {};
        throw err;
    }
};

//-------------------------------------------------------------------------------------------------
// CARREGAMENTOS DO STORE
//-------------------------------------------------------------------------------------------------

const oldMakeStore = () => {
    console.log("EPAA NOVO, 08/03/24 ", (Debug || {}).VERSION)
    if (webpackChunkwhatsapp_web_client && webpackChunkwhatsapp_web_client.length > 12 &&
        (!window.Store || !window.Store.Chat || !window.Store.SendTextMsgToChat)) {
        (function () {

            function getStore2(modules) {
                let foundCount = 0;
                for (let idx in modules) {
                    if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
                        neededObjects.forEach((needObj) => {
                            if (!needObj.conditions || needObj.foundedModule)
                                return;
                            let neededModule = needObj.conditions(modules[idx]);
                            if (neededModule !== null) {
                                foundCount++;
                                needObj.foundedModule = neededModule;
                            }
                        });

                        if (foundCount == neededObjects.length) {
                            break;
                        }
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

                window.Store.Chat.modelClass.prototype.sendMessage = function (e) {
                    window.Store.SendTextMsgToChat(this, ...arguments);
                }
                console.log(window.Store)
                return window.Store;
            }


            let tag = new Date().getTime();
            webpackChunkwhatsapp_web_client.push([
                ["parasite" + tag],
                {

                },
                function (o, e, t) {
                    let modules = [];
                    for (let idx in o.m) {
                        let module = o(idx);
                        modules.push(module);
                    }
                    getStore2(modules);
                }
            ]);

        })();
    }
}

const newMakeStore = () => {
    console.log("New make Store carregado!", "EPAA NOVO, 08/03/24 ")
    let modules = self.require('__debug').modulesMap;
    let keys = Object.keys(modules).filter(e => e.includes("WA"));
    let modulesFactory = {};
    for (let key of keys) {
        if (!modules[key])
            continue;
        let module = modules[key];
        modulesFactory[key] = {
            default: module.defaultExport,
            factory: module.factory,
            ...module
        };
        if (Object.keys(modulesFactory[key].default).length == 0) {
            try {
                self.ErrorGuard.skipGuardGlobal(true);
                Object.assign(modulesFactory[key], self.importNamespace(key));
            } catch (e) {
                console.error("Error importing:", key)
            }
        }
    }

    function getStore(modules) {
        let foundCount = 0;
        for (let idx in modules) {
            if ((typeof modules[idx] === "object") && (modules[idx] !== null)) {
                neededObjects.forEach((needObj) => {
                    if (!needObj.conditions || needObj.foundedModule)
                        return;
                    let neededModule = needObj.conditions(modules[idx]);
                    if (neededModule !== null) {
                        foundCount++;
                        needObj.foundedModule = neededModule;
                    }
                });

                if (foundCount == neededObjects.length) {
                    break;
                }
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

        window.Store.Chat.modelClass.prototype.sendMessage = function (e) {
            window.Store.SendTextMsgToChat(this, ...arguments);
        }
        console.log(window.Store)
        return window.Store;
    }

    getStore(modulesFactory);
}

const chooseFunction = () => {
    const store = (Debug || {}).VERSION.includes("2.3000") ? newMakeStore() : oldMakeStore()

    try {
        addObjectsStore();
    } catch (error) {
        console.log('Error addObjectsStore', error);
    }

    return store;
}

window.makeStore = chooseFunction

//-------------------------------------------------------------------------------------------------
// UTILS
//-------------------------------------------------------------------------------------------------

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Converts an image URL to a base64 string.
 *
 * @param {string} imgUrl - The URL of the image to convert.
 * @return {Promise<string>} A promise that resolves with the base64 string of the image.
 */
const convertToBase64 = (imgUrl) => new Promise(resolve => {
    var img = new Image();
    img.src = imgUrl;
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = (() => {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/gif");
        resolve(dataURL.replace(/^data:image\/(png|jpg);base64,/, "data:image/gif;base64,"));
    });
});

/**
 * @description Remove caracteres especiais e acentos antes do envio ao rasa
 *
 * @param {String} message - mensagem a ser obtida a intenÃ§Ã£o
 *
 * @returns {String} Mensagem a ser enviada pro rasa
 */
const removeSpecialCharacters = (message) => message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^.$/g, "")
    .replace(/[.,;:?!]/, "")

/**
 * Formato phone
 *
 * @returns {String}
 */
const getformatPhone = (phone) => {
    phone = phone.replace(/"/g, "").split('@')[0];
    return phone.split(':')[0];
}

/**
 * Treats a message to pause or start a bot.
 *
 * @param {object} msg - The message object.
 * @return {undefined} There is no return value.
 */
const treatPauseBot = (msg) => {
    const text = removeSpecialCharacters(msg.__x_body).toLowerCase()
    const receiver = msg.__x_to._serialized
    const shouldPauseBot = text.includes("pausar") && text.includes("robo")
    const shouldStartBot = text.includes("ativar") && text.includes("robo")

    if (shouldPauseBot) {
        const dateInfo = new Date()
        dateInfo.setMinutes(dateInfo.getMinutes() + 5)
        pausedReceivers.push({
            receiverId: receiver,
            expires_in: dateInfo
        })
    } else if (shouldStartBot) {
        const pausedIndex = pausedReceivers.findIndex(item => item.receiverId === receiver)

        if (pausedIndex !== -1) {
            pausedReceivers.splice(pausedIndex, 1)
        }
    }
}

/**
 * Crio prop se mensagem foi enviado pelo bot
 *
 * @param {Object} msg
 * @return {Boolean}
 */
const propMessageSendedBot = (msg) => {
    let isBotSendMessage = false;

    try {
        const to = msg.__x_to._serialized;
        const botSendedStorage = localStorage.getItem(`bot-msg-${to}`);

        if(to == botSendedStorage) {
            isBotSendMessage = true;
            localStorage.removeItem(`bot-msg-${to}`);
        }

    } catch (error) {
        console.log('Error get bot message', error);
    }

    return isBotSendMessage;
}

/**
 * Generates a new unique ID.
 */
window.API.getNewId = function () {
    let n = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70];
    let e = new Uint8Array(8);
    window.crypto.getRandomValues(e);
    for (var a = new Array(16), t = 0, r = 0; t < e.length; t++,
        r += 2) {
        var i = e[t];
        a[r] = n[i >> 4],
            a[r + 1] = n[15 & i]
    }
    return "3EB0" + String.fromCharCode.apply(String, a);
};

/**
 * Sends old messages if the Store and Msg objects are available.
 */
const sendOldMessages = () => {
    if (window.Store && Store.Msg) {
        console.log('Sending old messages...');
        (Store.Msg.models || Store.Msg.getModelsArray()).forEach(message => {
            if (message.__x_isNewMsg) {
                message.__x_isNewMsg = false;
                if(platform === 'anota-ai-desktop') window.API.listener.handle_msg(message);
                if(platform === 'CLOUDIA') receiverMessageCloudia(message);
                if(platform === 'VENDE_AI') receiverMessageCloudiaVendeAi(message);
            }
        });
    }
}

// ------------------------------------------------------------------------------------------------
// TRATAMENTOS PARA CLOUDIA
//-------------------------------------------------------------------------------------------------

window.WAPI = {};

/**
 * Sends the total chats by dispatching a custom event.
 */
window.WAPI.sendTotalChats = () => {
    document.dispatchEvent(new CustomEvent('send-total-chats'));
}

/**
 * Object containing the chat object for analitics
 *
 * @param {object} message
 * @returns {object}
 */
window.WAPI.messageAnalitycsTreat = (message) => {
    const idWhats = message.__x_from._serialized;
    const whats_id = message.__x_broadcastId
        ? message.__x_to._serialized
        : message.__x_isGroupMsg
            ? message.__x_author._serialized
            : idWhats

    const messageBody = message.__x_type == 'image' && message?.__x_caption
        ? message?.__x_caption
        : message.__x_type == 'image'
            ? ""
            : message?.__x_body

    return {
        is_merchant: message.isMyself || false,
        type: message.__x_type,
        message: messageBody,
        merchant_phone: window.API.getInfoWhatsapp().phone_merchant,
        message_timestamp: message.__x_t,
        is_group: message.__x_isGroupMsg ? true : false,
        whats_id: getformatPhone(whats_id),
        is_broadcast: message?.__x_broadcastId ? true : false,
    }
}

/**
 * Returns the version of the Debug object.
 *
 * @return {string} The version of the Debug object.
 */
window.WAPI.getVersion = () => {
    return window.API.getVersion();
}

/**
 * Checks if the user is logged in.
 *
 * @return {boolean} Returns true if the user is logged in, false otherwise.
 */
window.WAPI.isLoggedIn = () => {
    return window.API.isLoggedIn();
}

/**
 * Retrieves information about the WhatsApp application.
 */
window.WAPI.getInfoWhatsapp = () => {
    return window.API.getInfoWhatsapp();
}

/**
 * Retrieves all the chats from the window.
 *
 * @return {Array} An array of chats
 */
window.WAPI.getChats = () => {
    return window.API.getChats();
}

/**
 * Retrieves chat statistics including total conversations, archive count, non-archive count, and chat activity over different time periods.
 *
 * @return {Object} Object containing total conversations, archive count, non-archive count, and chat activity over different time periods
 */
window.WAPI.getChatStatistic = () => {
    return window.API.getChatStatistic();
}

/**
 * Sends an image message in a chat.
 *
 * @param {Chat} chat - The chat to send the message to.
 * @param {string} url - The URL of the image to send.
 * @param {string} caption - The caption for the image message.
 * @param {object} stickerData - The sticker data for the image.
 * @return {Promise} A promise that resolves with the sent message.
 */
// window.WAPI.sendImageMessage = async (chat, url, caption, stickerData) => {
//     return window.API.sendImageMessage(chat, url, caption, stickerData);
// }

/**
 * Sends a batch of messages to a specific sender.
 *
 * @param {Array} messagesInfo - An array of messages to be sent.
 * @param {string} senderId - The ID of the sender.
 * @return {boolean} - Returns true if the messages were sent successfully, false otherwise.
 */
window.WAPI.mainSendMessage = async (infos) => {
    return window.API.mainSendMessage(infos);
}

/**
 * Pego as informaÃ§Ãµes do perfil do usuario conectado
 */
window.WAPI.getMe = () => {
    return window.API.getMe();
}

/**
 * Receives and handles incoming messages CLOUDIA
 *
 * @param {Object} msg - The incoming message object.
 */
const receiverMessageCloudia = (msg) => {
    try {
        const sender = msg.__x_sender || msg.__x_from;
        const isFromMe = msg.__x_id.fromMe;

        msg.__x_isStatusV3 = msg.__x_from.server == "broadcast" || isFromMe ? true : false;
        msg.__x_isGroupMsg = msg.__x_from.server == "g.us" ? true : false;
        if (isFromMe) msg.isMyself = true;

        let shouldAnswer = true

        if (msg.isMyself) treatPauseBot(msg);

        if (pausedReceivers.length > 0 && !msg.isMyself) {
            const clientInteractionIndex = pausedReceivers.findIndex(item => item.receiverId === msg.__x_from._serialized)
            if (clientInteractionIndex !== -1) {
                const pausedInfo = pausedReceivers[clientInteractionIndex]
                if (pausedInfo.expires_in > new Date()) {
                    shouldAnswer = false
                } else {
                    pausedReceivers.splice(pausedInfo, 1)
                }
            }
        }

        if (shouldAnswer && !msg.__x_isGroupMsg && !msg.__x_isStatusV3 && !msg.isMyself) {
            let timeSendMessage = msg?.__x_t;
            if (timeSendMessage) {
                const oneMinute = 1000 * 60;
                const timeNow = new Date().getTime();
                timeSendMessage = new Date(timeSendMessage * 1000).getTime();

                const differenceDate = timeNow - timeSendMessage;
                const diffInMinutes = Math.round(differenceDate / oneMinute);
                if (diffInMinutes > 10) {
                    console.log('NÃ£o envia mensagens que tenham sido enviadas a mais de 10 minutos')
                    return;
                }
            }

            const objSendToServer = {
                sender: {
                    idwhats: sender._serialized,
                    name: msg.__x_notifyName,
                    picture: ""
                },
                type: msg.__x_type,
            };

            if (msg?.__x_senderObj?.__x_profilePicThumb?.__x_eurl) {
                objSendToServer.sender.picture = msg.__x_senderObj.__x_profilePicThumb.__x_eurl;
            }

            if (msg.__x_type == "location" && msg.__x_lat && msg.__x_lng) {
                objSendToServer.location = {
                    lat: msg.__x_lat,
                    lng: msg.__x_lng
                };
            } else if (msg.__x_type == "chat" || msg.__x_type == "ciphertext") {
                objSendToServer.message = msg.__x_body;
            }

            const ACCEPTED_MESSAGE_TYPES = ['chat', 'ptt', 'location', "ciphertext"];

            if (ACCEPTED_MESSAGE_TYPES.includes(msg.__x_type)) {
                console.log("[CLOUDIA] dispatching messageReceived event");

                if (msg.__x_type == "ptt") {
                    window.API.processMediaMessage(msg, 60000).then(item => {
                        objSendToServer.media = item;
                        objSendToServer.mimetype = msg.__x_mimetype;
                        objSendToServer.duration = msg.__x_duration;

                        document.dispatchEvent(new CustomEvent("messageReceived", {
                            detail: objSendToServer,
                        }));

                        document.dispatchEvent(new CustomEvent('sendMessageAnalitycs', {
                            detail: window.WAPI.messageAnalitycsTreat(msg)
                        }));
                    });

                }else{

                    document.dispatchEvent( new CustomEvent('messageReceived', {
                        detail: objSendToServer
                    }))
                    document.dispatchEvent(new CustomEvent('sendMessageAnalitycs', {
                        detail: window.WAPI.messageAnalitycsTreat(msg)
                    }));
                }

            } else {
                console.log(`[CLOUDIA] Ignoring message type ${msg.__x_type}`)
            }

        } else {
            console.log("[CLOUDIA] ---------------");
            console.log("[CLOUDIA] ignorando msg");
            console.log("[CLOUDIA] ---------------");
            console.log(`[CLOUDIA] shouldAnswer: ${shouldAnswer}`)
            console.log(`[CLOUDIA] msg.__x_isGroupMsg: ${msg.__x_isGroupMsg}`)
            console.log(`[CLOUDIA] msg.__x_isStatusV3: ${msg.__x_isStatusV3}`)
            console.log(`[CLOUDIA] msg.isMyself: ${msg.isMyself}`)
            console.log("[CLOUDIA] ---------------");
            console.log(`[CLOUDIA] msg type: ${msg.__x_type}`);
            console.log(`[CLOUDIA] msg subtype: ${msg.__x_subtype}`);
            console.log("[CLOUDIA] ---------------");
        }

    } catch (error) {
        console.log('Error receiver message handler', error);
    }
}

/**
 * Receives and handles incoming messages CLOUDIA VENDEAI
 *
 * @param {Object} msg - The incoming message object.
 */
const receiverMessageCloudiaVendeAi = (msg) => {

    const userId = window.API.getMyChatId().user ?? "";
    const isBotSendMessage = propMessageSendedBot(msg);

    let defaultObj = {
        to: msg?.__x_to.user,
        from: msg?.__x_from.user,
        type: msg?.__x_type,
        text: msg?.__x_body,
        userId,
        received_user_name: msg?.notifyName,
        whatsInfo: {
            id: {
                fromMe: msg.__x_id.fromMe,
                id: msg.__x_id.id
            },
            message_type: "message_received",
            body: msg.__x_type === "chat" ? msg.__x_body : msg.__x_type,
            type: msg.__x_type,
            message_timestamp: msg.__x_t,
            isNewMsg: msg.__x_isNewMsg,
            from: msg.__x_from._serialized,
            to: msg.__x_to._serialized,
            disappearingModeInitiator: msg.__x_disappearingModeInitiator,
            disappearingModeTrigger: msg.__x_disappearingModeTrigger,
            disappearingModeInitiatedByMe: msg.__x_disappearingModeInitiatedByMe,
            isFromTemplate: false
        }
    }

    if (msg.__x_id.fromMe) {
        const event = new CustomEvent("messageSent", {
            detail: {
                ...defaultObj,
                isBotSendMessage,
                sender_user_name: window.API.getMeComplete().name,
                whatsInfo: {
                    ...defaultObj.whatsInfo,
                    message_type: isBotSendMessage ? "txt_bot" : "message_sent",
                    disappearingModeInitiator: msg.__x_disappearingModeInitiator ?? false,
                    disappearingModeTrigger: msg.__x_disappearingModeTrigger ?? false,
                    disappearingModeInitiatedByMe: msg.__x_disappearingModeInitiatedByMe ?? false,
                }
            }
        })

        return document.dispatchEvent(event);
    }

    if(msg.__x_type == 'ptt') {
        return window.API.processMediaMessage(msg, 60000).then(item => {
            defaultObj.media = item;
            defaultObj.mimetype = msg.__x_mimetype;

            document.dispatchEvent(new CustomEvent("messageReceived", {
                detail: defaultObj,
            }));
        });
    }

    return document.dispatchEvent(new CustomEvent("messageReceived", {
        detail: defaultObj
    }));
}

//-------------------------------------------------------------------------------------------------
// TRATAMENTO PARA INICIO DO FLUXO
//-------------------------------------------------------------------------------------------------

/**
 * FaÃ§o o tratamento de eventos recebidos pelo whatsapp
 */
window.API.fixStores = function () {

    let sendedEventWhatsSync = false;
    let qrcodeRead = false;

    // receiver new message event
    Store.Msg.on('add', (message) => {
        if (message.__x_isNewMsg) {

            //console.log('new message: ', message);
            //console.log('platform: ', platform);

            if (window.switch) {
                message.__x_isNewMsg = false;
                message.isNewMsg = false;
            }

            if(platform === 'anota-ai-desktop') window.API.listener.handle_msg(message);
            if(platform === 'CLOUDIA') receiverMessageCloudia(message);
            if(platform === 'VENDE_AI') receiverMessageCloudiaVendeAi(message);
        }
    })

    // new send message
    Store.Chat.modelClass.prototype.sendMessage = function(e, obj) {
        //console.log('new send message');

        if (!this.sendMessageQueue) {
            this.sendMessageQueue = [];
        }
        if (!this.sendMessageInterval) {
            this.sendMessageInterval = setInterval(() => {
                if (this.sendMessageQueue && this.sendMessageQueue.length > 0) {
                    this.sendMessageQueue.shift()();
                }
            }, 10);
        }

        return new Promise((resolve, reject) => {
            this.sendMessageQueue.push(async () => {
                try {
                    let newId = new Store.CreateMsgKey.default({
                        from: Store.GetMaybeMeUser.getMaybeMeUser(),
                        to: this.id,
                        id: API.getNewId(),
                        participant: this.isGroup ? Store.GetMaybeMeUser.getMaybeMeUser() : undefined,
                        selfDir: "out"
                    });

                    let tempMsg = API.createBaseMsg(newId, this.id);
                    tempMsg.type = 'chat';

                    if (obj) {
                        if (obj.quotedMsg) {
                            Object.assign(tempMsg, obj.quotedMsg.msgContextInfo(this.id));
                        }
                        if (obj.media) {
                            let forceSticker = !!obj.media.stickerData;
                            let stickerData = forceSticker ? {
                                stickerName: obj.media.stickerData.stickerName,
                                collectionName: obj.media.stickerData.collectionName
                            } : null;
                            let mediaOptions = await API.buildMediaData(obj.media.data, obj.media.fileName, obj.media.forceDocument, stickerData);
                            Object.assign(tempMsg, {
                                ...mediaOptions,
                            });

                            if (!obj.media.forceDocument && e) {
                                tempMsg.caption = e;
                                e = ''
                            }
                        }
                    }

                    if (!tempMsg.body) tempMsg.body = e;

                    let results = Store.AddAndSendMsgToChat(this, tempMsg);
                    let msg = await results[0];

                    results[1].then(value => {
                        if (value.messageSendResult !== 'OK') {
                            console.error(`Error on send message ${tempMsg.body} - ${value}`);
                        }
                    }).catch(reason => {
                        console.error(`Error on send message ${tempMsg.body} - ${reason}`);
                    });

                    resolve(msg);

                } catch (e) {
                    console.error(e.stack);
                    reject(e);
                }
            });
        });
    }

    // whatsapp has synced event
    const intervalEventSynd = setInterval(() => {
        try {
            if (Store?.Socket?.hasSynced === true && !sendedEventWhatsSync) {
                console.log('Event: has-synced-whatsapp');

                if(platform !== 'VENDE_AI') sendOldMessages();

                if (!initialStateConnection) {
                    console.log('Event: phone-authed-whatsapp');
                    if(platform === 'anota-ai-desktop') document.dispatchEvent(new CustomEvent('phone-authed-whatsapp'));
                    qrcodeRead = true;
                }

                document.dispatchEvent(new CustomEvent('has-synced-whatsapp', { detail: { hasSynced: true, qrcodeRead } }));

                if(platform === 'CLOUDIA') document.dispatchEvent(new CustomEvent('send-total-chats'));
                if(platform === 'VENDE_AI') document.dispatchEvent(new CustomEvent('phone-authed-whatsapp'));

                sendedEventWhatsSync = true;
                clearInterval(intervalEventSynd);
            }

        } catch (e) { }
    }, 100);

}

/**
 * FaÃ§o um interval atÃ© que o store seja carregado (Inicio do fluxo)
 */
window.API.waitStateLoad = function () {
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            try {
                window.makeStore();

                if (window.Store) {
                    clearInterval(intervalId);
                    window.API.fixStores();
                    resolve();
                }

            } catch (e) { }
        }, 100);
    });
};

setTimeout(() => {
    console.log("INICIANDO...")
    API.waitStateLoad();
}, 10000);