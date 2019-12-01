import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Shots from '../views/Shots.vue';
import Capture from '../views/Capture.vue';
import MovieHome from '../views/MovieHome.vue';

Vue.use(VueRouter);

const routes = [
  {
    name: 'home',
    path: '/',
    component: Home,
  },

  {
    name: 'smartphone',
    path: '/smartphone',
    component: () => import('../views/SmartphoneView.vue'),
  },
  {
    name: 'movieHome',
    path: '/movies/:projectId',
    component: MovieHome,
  },
  {
    name: 'captureShots',
    path: '/movies/:projectId/capture/shots',
    component: Shots,
  },
  {
    name: "captureShot",
    path: '/movies/:projectId/capture/shots/:shotId',
    component: Capture,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});


export default router;
