import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import Config from '../views/Configs.vue'

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
  }
];

const router = new VueRouter({
  routes
})

export default router
