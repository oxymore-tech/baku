import Vue from 'vue';
import Vuex from 'vuex';

import { captureStore } from './capture';
import { ProjectStore } from '@/store/project';
import { WebrtcStore } from './webrtc';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {},
  modules: {
    webrtc: WebrtcStore,
    project: ProjectStore,
    capture: captureStore,
  },
});
