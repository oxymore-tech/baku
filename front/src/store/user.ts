
interface UserState {
  username: string;
}

export const UsernameList: string[] = [
  "American Virginia opossum",
  "American alligator",
  "American badger",
  "American beaver",
  "American bighorn sheep",
  "American bison",
  "American black bear",
  "American buffalo",
  "American crow",
  "American marten",
  "American racer",
  "American woodcock",
  "Anaconda",
  "Andean goose",
  "Ant",
  "Anteater",
  "Antechinus",
  "Antelope",
  "Arboral spiny rat",
  "Arctic fox"
];

export const UserStore = {
  namespaced: true,
  state: {
    username: UsernameList[Math.floor(Math.random() * Math.floor(UsernameList.length))] + ' (anonymous)'
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
