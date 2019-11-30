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
    path: '/smartphone',
    name: 'smartphone',
    component: () => import('../views/SmartphoneView.vue'),
  },
  {
    path: '/capture',
    name: 'capture',
    component: () => import('../views/Capture.vue'),
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
  },
  {
    path: '/:projectid',
    name: 'Home',
    component: Home,
  },
  {
    path: '/:projectid/home',
    name: 'Home',
    component: Home,
  },
  {
    path: '/:projectid/capture',
    name: 'capture',
    component: () => import('../views/Capture.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
