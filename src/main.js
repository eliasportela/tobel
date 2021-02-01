import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueResource from 'vue-resource'
import VueSocketIO from 'vue-socket.io';
import './assets/bootstrap.min.css'

Vue.use(VueResource);
Vue.use(new VueSocketIO({
  debug: false,
  connection: process.env.VUE_APP_BASE_SOCKET
}));

Vue.config.productionTip = false
Vue.http.options.emulateJSON = true;
Vue.http.options.emulateHTTP = true;
Vue.http.options.root = process.env.VUE_APP_BASE_SERVER + 'api/';

Vue.use(VueResource);

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
