import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Config from '../views/Configs.vue'
import Blocklist from '../views/Blocklist.vue'
import Cliente from '../views/Cliente.vue'

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/config',
    name: 'config',
    component: Config
  },
  {
    path: '/blocklist',
    name: 'blocklist',
    component: Blocklist
  },
  {
    path: '/cliente/:id',
    name: 'cliente',
    component: Cliente
  }
];

const router = new VueRouter({
  routes
});

export default router
