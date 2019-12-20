interface UserState {
  username: string;
}
const gfynonce = require('gfynonce');

const getUsername = () => {
  const res = localStorage.getItem('username');
  if (res === null) {
    const res = gfynonce({ adjectives: 1, separator: ' ' });
    localStorage.setItem('username', res);
  }
  return res;
};

export const UserStore = {
  namespaced: true,
  state: {
    username: getUsername(),
  },
  mutations: {
    changeUsername(state: UserState, name: string) {
      state.username = name;
    },
  },
  actions: {
    changeUsername(context: { commit: any, state: UserState }, name: string) {
      context.commit('changeUsername', name);
    },
  },
  getters: {
  },
};
