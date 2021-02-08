<template>
  <div id="app">
    <router-view/>
  </div>
</template>
<script>
  const { ipcRenderer } = require('electron');

  export default {
    sockets: {
      request_human(data) {
        ipcRenderer.send('socket-event', data);
      },

      delivery_whatsapp(data) {
        ipcRenderer.send('socket-send', data);
      }
    }
  }
</script>
