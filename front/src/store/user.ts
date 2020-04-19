import store from "@/store";
import { BakuModule, UserState, SeenProject } from './store.types';
import { Quality } from '@/utils/uploadedImage.class';
import { Spinner } from '@/utils/spinner.class';

const yokaiList = [
  'Akuma', 'Asobibi', 'Bakebi', 'Bakeneko', 'Baku', 'Daki', 'Enkō', 'Fūbo', 'Genbu', 'Hakuba', 'Hinode',
  'Ikuchi', 'Jashin', 'Kappa', 'Kirin', 'Kitsune', 'Kodama', 'Kowai', 'Mononoke', 'Ninko', 'Ōgama', 'Ōkami',
  'Oni', 'Raijū', 'Reiki', 'Ryū', 'Saburō', 'Sankai', 'Sankibō', 'Sarugami', 'Satori', 'Shiryō', 'Shisa', 'Sōgenbi',
  'Sōjōbō', 'Son Gokū', 'Taiba', 'Tanuki', 'Tatsu', 'Tengubi', 'Tenji', 'Tenko', 'Tōtetsu', 'Uba Ga Hi', 'Ubume',
  'Uryû', 'Uwan', 'Waira', 'Yōko', 'Yōsei', 'Yosuzume', 'Yukinko', 'Yurei', 'Zan', 'Zorigami', 'Zuijin'];

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

const defaultProject = {
  id: 'premier_montage',
  title: 'Mes premières fois',
  posterUrl: '/img/PremFois.81be95db.jpg',
}

const initializeSeenProjects = () => {
  const seenProjectsJson = localStorage.getItem('seenProjects')
  if (seenProjectsJson) {
    return JSON.parse(seenProjectsJson);
  }
  return [defaultProject]
};

export const UserStore: BakuModule<UserState> = {
  namespaced: true,
  state: {
    username: initializeUsername(),
    seenProjects: initializeSeenProjects(),
  },
  mutations: {
    addSeenProject(state, project: SeenProject) {
      let start = state.seenProjects.slice()
      start.unshift(project)
      start = start.slice(0, 10);
      start.push(defaultProject)

      const result = [];
      const map = new Map();
      for (const item of start) {
        if(!map.has(item.id)){
          map.set(item.id, true);    // set any value to Map
          result.push(item);
        }
      }
      state.seenProjects = result
    },
  },
  actions: {
    updateSeenProjects(context, project: SeenProject) {

      const projectId = store.state.project.id;
      if (projectId) {
        const movie = store.getters["project/movie"];
        let posterUrl: string = Spinner;
        if (movie.poster) {
          posterUrl = movie.poster;
        } else if (movie && movie.shots && movie.shots.length > 0 && movie.shots[0].images && movie.shots[0].images.length > 0) {
          posterUrl = movie.shots[0].images[0].getUrl(Quality.Original);
        }
        const project: SeenProject = {
          id: projectId,
          title: movie.title,
          posterUrl: posterUrl,
        }
        context.commit('addSeenProject', project);
        localStorage.setItem('seenProjects', JSON.stringify(context.state.seenProjects));
      }

    },
  },
  getters: {},
};
