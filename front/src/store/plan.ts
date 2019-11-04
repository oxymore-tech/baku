import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export const planStore = {
  namespaced: true,
  state: {
    pictures: [] as string[]
  },
  mutations: {
    addNewPicture(state: any, pictureId: string){
        state.pictures = [...state.pictures, pictureId]
    }
  },
  actions: {
  },
  getters: {
      getPictures: (state: any) => state.pictures
  },
  modules: {}
};
