import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import MovieHome from '../views/MovieHome.vue';

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
    component: Home,
  },
  {
    path: '/movies/:projectid',
    component: MovieHome,
  },
  {
    path: '/movies/:projectid/shots/',
    component: () => import('../views/ShotChoice.vue'),
  },
  {
    name: "shotCapture",
    path: '/movies/:projectid/shots/:shotId/',
    component: () => import('../views/Capture.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});


export default router;
