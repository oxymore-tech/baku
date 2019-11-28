import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/capture',
    name: 'capture',
    component: () => import('../views/Capture.vue'),
  },
  {
    path: '/smartphone',
    name: 'smartphone',
    component: () => import('../views/SmartphoneView.vue'),
  },
  {
    path: '/project/:projectid',
    name: 'Project',
    component: () => import('../views/Project.vue'),
  },
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
});

export default router;
