
interface UserState {
  username: string;
}
const gfynonce = require('gfynonce');


export const UserStore = {
  namespaced: true,
  state: {
    username: gfynonce({ adjectives: 1, separator: ' ' }) + ' (anonymous)'
  },
  mutations: {
    changeUsername(state: UserState, name: string) {
      state.username = name;
    }
  },
  actions: {
    changeUsername(context: { commit: any, state: UserState }, name: string) {
      context.commit('changeUsername', name);
    }
  },
  getters: {
  },
};
