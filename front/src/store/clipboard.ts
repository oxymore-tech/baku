import { BakuModule, ClipboardState } from "./store.types";


export const ClipboardStore: BakuModule<ClipboardState> = {
  namespaced: true,
  state: {
    images: []
  },
  mutations: {
    changeClipboard(state, images: string[]) {
      state.images = images;
    },
  },
  actions: {
    changeClipboard(context, images: string[]){
      context.commit('changeClipboard', images);
    }
  },
  getters: {
  }
};
