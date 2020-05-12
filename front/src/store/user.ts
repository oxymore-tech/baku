import store from "@/store";
import { BakuModule, SeenProject, UserState } from './store.types';
import { deleteProject, getHistory } from "@/api";
import { MovieService } from "@/utils/movie.service";

// local storage keys
const lsUsernameKey = 'username';
const lsSeenProjectsKey = 'seenProjects';

const yokaiList = [
  'Akuma', 'Asobibi', 'Bakebi', 'Bakeneko', 'Baku', 'Daki', 'Enkō', 'Fūbo', 'Genbu', 'Hakuba', 'Hinode',
  'Ikuchi', 'Jashin', 'Kappa', 'Kirin', 'Kitsune', 'Kodama', 'Kowai', 'Mononoke', 'Ninko', 'Ōgama', 'Ōkami',
  'Oni', 'Raijū', 'Reiki', 'Ryū', 'Saburō', 'Sankai', 'Sankibō', 'Sarugami', 'Satori', 'Shiryō', 'Shisa', 'Sōgenbi',
  'Sōjōbō', 'Son Gokū', 'Taiba', 'Tanuki', 'Tatsu', 'Tengubi', 'Tenji', 'Tenko', 'Tōtetsu', 'Uba Ga Hi', 'Ubume',
  'Uryû', 'Uwan', 'Waira', 'Yōko', 'Yōsei', 'Yosuzume', 'Yukinko', 'Yurei', 'Zan', 'Zorigami', 'Zuijin'];

const initializeUsername = () => {
  // retrieve last username if exists
  const username = localStorage.getItem(lsUsernameKey);
  if (username) {
    return username;
  }

  // generate username
  const randIdx = Math.floor(Math.random() * yokaiList.length);
  const generatedUsername = yokaiList[randIdx];
  localStorage.setItem(lsUsernameKey, generatedUsername);
  return generatedUsername;
};

const initializeSeenProjects = () => {
  const seenProjectsJson = localStorage.getItem(lsSeenProjectsKey)
  if (seenProjectsJson) {
    return JSON.parse(seenProjectsJson);
  }
  return [];
};

export const UserStore: BakuModule<UserState> = {
  namespaced: true,
  state: {
    username: initializeUsername(),
    seenProjects: initializeSeenProjects(),
  },
  mutations: {
    updateSeenProjects(state, seenProjects: SeenProject[]) {
      localStorage.setItem(lsSeenProjectsKey, JSON.stringify(seenProjects));
      state.seenProjects = MovieService.removeDoublons(seenProjects);
    },
    addSeenProject(state, project: SeenProject) {
      const newSeenProjects = MovieService.removeDoublons([project, ...state.seenProjects]);
      localStorage.setItem(lsSeenProjectsKey, JSON.stringify(newSeenProjects));
      state.seenProjects = newSeenProjects;
    },
    deleteSeenProject(state, toDelete: SeenProject) {
      const toDeleteIndex = state.seenProjects.findIndex(s => s.id == toDelete.id);
      if (toDeleteIndex > -1) {
        state.seenProjects.splice(toDeleteIndex, 1);
        localStorage.setItem(lsSeenProjectsKey, JSON.stringify(state.seenProjects));
      }
    }
  },
  actions: {
    async refreshSeenProjectsMetadata(context) {
      const updatedSeenProjects = [];
      for (const seenProject of context.state.seenProjects) {
        try {
          const history = await getHistory(seenProject.id);
          const movie = MovieService.merge(seenProject.id, history);
          updatedSeenProjects.push({
            ...seenProject,
            title: movie.title,
            fps: movie.fps,
            totalImages: MovieService.getTotalImages(movie),
            posterUrl: MovieService.getPosterUrl(movie),
            synopsis: movie.synopsis,
            locked: movie.locked,
            lastUpdate: MovieService.getLastUpdate(history)
          });
        } catch (e) {
          console.log(`Movie ${seenProject.id} not found on server : remove from loca storage`);
        }
      }
      await context.commit('updateSeenProjects', updatedSeenProjects);
    },
    async deleteSeenProject(context, projectId: string) {
      await deleteProject(projectId);
      const toDelete = context.state.seenProjects.find(s => s.id === projectId);
      if (toDelete) {
        await context.commit('deleteSeenProject', toDelete);
      }
    },
    async updateCurrentSeenProject(context) {
      let projectId = store.state.project.id;
      if (projectId) {
        const movie = store.getters["project/movie"];
        const history = store.state.project.history;

        let adminId = undefined;
        if (projectId.length > 36) {
          // Admin link
          adminId = projectId;
          projectId = projectId.slice(0, 36);
        }

        const project: SeenProject = {
          id: projectId,
          adminId,
          title: movie.title,
          posterUrl: MovieService.getPosterUrl(movie),
          synopsis: movie.synopsis,
          locked: movie.locked,
          fps: movie.fps,
          totalImages: MovieService.getTotalImages(movie),
          lastUpdate: MovieService.getLastUpdate(history)
        }

        await context.commit('addSeenProject', project);
      }
    },
  },
  getters: {
    getPersonalisedProjectTitle: (state) => {
      const prefix = "Film de " + state.username;
      let suffixNumber = 0;
      let suffix = "";
      const titles = state.seenProjects.map((p) => p.title).sort();
      for (const seenTitle of titles) {
        if (prefix + suffix === seenTitle) {
          suffixNumber += 1;
          suffix = " (" + suffixNumber + ")";
        }
      }
      return prefix + suffix;
    }
  }
};
