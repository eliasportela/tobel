import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueResource from 'vue-resource'
import VueSocketIO from 'vue-socket.io';
import VueSwal from 'vue-swal'
import VueTheMask from 'vue-the-mask'
const Config = require('electron-config');

import './assets/bootstrap.min.css'
import 'animate.css/animate.css'
import '@fortawesome/fontawesome-free/css/all.css'

const audio = new Audio("https://lecard-cdn.nyc3.digitaloceanspaces.com/lecard-gestor/lebot-bell.mp3");

Vue.use(VueResource);
Vue.use(VueSwal);
Vue.use(VueTheMask);
Vue.use(new VueSocketIO({
  debug: false,
  connection: process.env.VUE_APP_BASE_SOCKET
}));

Vue.mixin({
  methods: {
    playNotification() {
      if (audio.paused) {
        audio.play();
      }
    },

    pauseNotification() {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }
});

Vue.config.productionTip = false;
Vue.http.options.emulateJSON = true;
Vue.http.options.emulateHTTP = true;

const config = new Config();
const base_server = config.get('homologacao') ? process.env.VUE_APP_BASE_HOMOLOGACAO : process.env.VUE_APP_BASE_SERVER;
Vue.http.options.root = base_server + 'api/';

Vue.use(VueResource);

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
