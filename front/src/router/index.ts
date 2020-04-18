import Vue from 'vue';
import VueRouter from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CollaborationView from '../views/CollaborationView.vue';
import CaptureView from '../views/CaptureView.vue';
import MovieHomeView from '../views/MovieHomeView.vue';
import ShotsView from '../views/ShotsView.vue';
import TodoView from '../views/TodoView.vue';
import SmartphoneView from '../views/SmartphoneView.vue';

Vue.use(VueRouter);

const routes = [
  {
    name: 'home',
    path: '/',
    component: HomeView,
  },

  {
    name: 'smartphone',
    path: '/smartphone/:socketId',
    component: SmartphoneView,
  },
  {
    name: 'movieHome',
    path: '/movies/:projectId',
    component: MovieHomeView,
  },
  {
    name: 'scenario',
    path: '/movies/:projectId/scenario',
    component: TodoView,
  },
  {
    name: 'storyboard',
    path: '/movies/:projectId/storyboard',
    component: TodoView,
  },
  {
    name: 'captureShots',
    path: '/movies/:projectId/capture/shots',
    component: ShotsView,
  },
  {
    name: 'captureShot',
    path: '/movies/:projectId/capture/shots/:shotId',
    component: CaptureView,
  },
  {
    name: 'movieEditing',
    path: '/movies/:projectId/movieEditing',
    component: TodoView,
  },
  {
    name: 'collaboration',
    path: '/movies/:projectId/collaboration',
    component: CollaborationView,
  },
];

const router = new VueRouter({
  mode: 'history',
  routes,
});

export default router;
