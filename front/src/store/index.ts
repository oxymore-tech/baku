import Vue from 'vue';
import Vuex from 'vuex';
import { planStore } from './plan';
import { captureStore } from './capture';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    isConnected: false,
  },
  mutations: {
    setupConnection(state) {
      state.isConnected = true;
    },
  },
  actions: {
    // setupConnection: (context) => {
    //   context.commit('connected')

    // }
  },
  modules: {
    plan: planStore,
    capture: captureStore,
  },
});
