const yokaiList = ['Akuma', 'Asobibi', 'Bakebi', 'Bakeneko', 'Baku', 'Daki', 'Enkō', 'Fūbo', 'Genbu', 'Hakuba', 'Hinode', 'Ikuchi', 'Jashin', 'Kappa', 'Kirin', 'Kitsune', 'Kodama', 'Kowai', 'Mononoke', 'Ninko', 'Ōgama', 'Ōkami', 'Oni', 'Raijū', 'Reiki', 'Ryū', 'Saburō', 'Sankai', 'Sankibō', 'Sarugami', 'Satori', 'Shiryō', 'Shisa', 'Sōgenbi', 'Sōjōbō', 'Son Gokū', 'Taiba', 'Tanuki', 'Tatsu', 'Tengubi', 'Tenji', 'Tenko', 'Tōtetsu', 'Uba Ga Hi', 'Ubume', 'Uryû', 'Uwan', 'Waira', 'Yōko', 'Yōsei', 'Yosuzume', 'Yukinko', 'Yurei', 'Zan', 'Zorigami', 'Zuijin'];

const initializeUsername = () => {
  // retrieve last username if exists
  const username = localStorage.getItem('username');
  if (username) {
    return username;
  }

  // generate username
  const randIdx = Math.floor(Math.random() * yokaiList.length);
  const generatedUsername = yokaiList[randIdx];
  localStorage.setItem('username', generatedUsername);
  return generatedUsername;
};

export const UserStore = {
  namespaced: true,
  state: {
    username: initializeUsername(),
  },
  mutations: {},
  actions: {},
  getters: {},
};
