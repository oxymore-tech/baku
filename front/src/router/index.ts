import Vue from 'vue';
import VueRouter from 'vue-router';

import store from "@/store";
import HomeView from '@/views/HomeView.vue';
import TodoView from '@/views/TodoView.vue';
import LibraryView from '@/views/LibraryView.vue';
import MovieView from '@/views/MovieView.vue';
import CaptureView from '@/views/CaptureView.vue';
import SmartphoneView from '@/views/SmartphoneView.vue';

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
    path: '/movies/:projectId',
    component: MovieView,
  },
  {
    name: 'captureShot',
    path: '/movies/:projectId/shots/:shotId',
    component: CaptureView,
  },
  {
    name: 'movieEditing',
    path: '/movies/:projectId/movieEditing',
    component: TodoView,
  }
];

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes,
});

router.afterEach((to, from) => {
  store.dispatch('user/updateCurrentSeenProject');
})

export default router;
