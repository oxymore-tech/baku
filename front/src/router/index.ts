import Vue from 'vue';
import VueRouter, { Route } from 'vue-router';

import store from "@/store";
import HomeView from '@/views/HomeView.vue';
import TodoView from '@/views/TodoView.vue';
import LibraryView from '@/views/LibraryView.vue';
import MovieView from '@/views/MovieView.vue';
import SmartphoneView from '@/views/SmartphoneView.vue';
import AudioView from '@/views/AudioView.vue';
import ZoneTTS from '@/views/ZoneTTS.vue';
const Capture = () => import('@/views/CaptureView.vue');

const routes = [
  {
    name: 'home',
    path: '/',
    component: HomeView,
  },
  {
    name: 'library',
    path: '/library',
    component: LibraryView,
  },
  {
    name: 'smartphone',
    path: '/smartphone/:socketId',
    component: SmartphoneView,
  },
  {
    name: 'movie',
    path: '/movies/:projectId/(admin)?',
    component: MovieView,
  },
  {
    name: 'captureShot',
    path: '/movies/:projectId/shots/:shotId/(admin)?',
    component: Capture,
  },
  {
    name: 'movieEditing',
    path: '/movies/:projectId/movieEditing',
    component: TodoView,
  },
  {
    name: 'audio',
    path: '/movies/:projectId/audio/(admin)?',
    component: AudioView,
  },
  {
    name: 'tts',
    path: '/tts',
    component: ZoneTTS
  }
];

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes,
});

router.beforeEach((to: Route, _from: Route, next: Function) => {
  if(to.params.projectId && to.params.projectId.length > 36 && !to.fullPath.includes('admin')) {
    next( to.path + '/admin');
  }
  next();
});

router.afterEach((to: Route, _from: Route) => {
  store.dispatch('user/updateCurrentSeenProject');
});

export default router;
