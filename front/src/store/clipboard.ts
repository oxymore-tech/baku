import { BakuModule, ClipboardState } from "./store.types";


export const ClipboardStore: BakuModule<ClipboardState> = {
  namespaced: true,
  state: {
    images: []
  },
  mutations: {
    changeClipboard(state: { images: string[]; }, images: string[]) {
      state.images = images;
    },
  },
  actions: {
    changeClipboard(context: { commit: (arg0: string, arg1: string[]) => void; }, images: string[]){
      context.commit('changeClipboard', images);
    }
  },
  getters: {
  }
};
