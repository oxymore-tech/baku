import Vue from 'vue';
import Vuex from 'vuex';

import { ProjectStore } from '@/store/project';
import { captureStore } from './capture';
import { WebrtcStore } from './webrtc';
import { UserStore } from './user';

Vue.use(Vuex);

export default new Vuex.Store({
  // state: {
  // },
  mutations: {
  },
  actions: {},
  modules: {
    webrtc: WebrtcStore,
    project: ProjectStore,
    capture: captureStore,
    user: UserStore,
  },
  strict: process.env.NODE_ENV !== 'production',
});
