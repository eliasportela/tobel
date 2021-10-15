import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Config from '../views/Configs.vue'
import Blocklist from '../views/Blocklist.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/config',
    name: 'Config',
    component: Config
  },
  {
    path: '/blocklist',
    name: 'Blocklist',
    component: Blocklist
  }
];

const router = new VueRouter({
  routes
})

export default router
