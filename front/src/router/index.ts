import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Collaboration from '../views/Collaboration.vue';
import Capture from '../views/Capture.vue';
import MovieHome from '../views/MovieHome.vue';
import Shots from '../views/Shots.vue';
import Todo from '../views/Todo.vue';

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
    name: 'scenario',
    path: '/movies/:projectId/scenario',
    component: Todo,
  },
  {
    name: 'storyboard',
    path: '/movies/:projectId/storyboard',
    component: Todo,
  },
  {
    name: 'captureShots',
    path: '/movies/:projectId/capture/shots',
    component: Shots,
  },
  {
    name: 'captureShot',
    path: '/movies/:projectId/capture/shots/:shotId',
    component: Capture,
  },
  {
    name: 'movieEditing',
    path: '/movies/:projectId/movieEditing',
    component: Todo,
  },
  {
    name: 'collaboration',
    path: '/movies/:projectId/collaboration',
    component: Collaboration,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});


export default router;
