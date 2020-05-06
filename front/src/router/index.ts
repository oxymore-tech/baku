import Vue from 'vue';
import VueRouter from 'vue-router';

import store from "@/store";
import HomeView from '@/views/HomeView.vue';
import TodoView from '@/views/TodoView.vue';
import ShotsView from '@/views/ShotsView.vue';
import CaptureView from '@/views/CaptureView.vue';
import MovieHomeView from '@/views/MovieHomeView.vue';
import SmartphoneView from '@/views/SmartphoneView.vue';
import CollaborationView from '@/views/CollaborationView.vue';

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
    path: '/api',
    children: [
      {
        name: 'video-status',
        path: ':projectId/video/status',
      },
      {
        name: 'video',
        path: ':projectId/video',
      },
      {
        name: 'stack',
        path: ':projectId/stack',
      },
      {
        name: 'history',
        path: ':projectId/history',
      },
      {
        name: 'upload',
        path: ':projectId/upload',
      },
      {
        name: 'exportProject',
        path: ':projectId/export.zip',
      },
      {
        name: 'exportShot',
        path: ':projectId/:shotId/export.zip',
      },
      {
        name: 'movie',
        path: 'movie',
      }
    ]
  }
];

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes,
});

router.afterEach((to, from) => {
  store.dispatch('user/updateSeenProjects');
})

export default router;
