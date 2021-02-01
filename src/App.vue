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
      }
    }
  }
</script>
