import store from "@/store";
import { BakuModule, SeenProject, UserState } from "./store.types";
import { deleteProject, getHistory } from "@/api";
import { MovieService } from "@/utils/movie.service";

// local storage keys
const lsUsernameKey = "username";
const lsSeenProjectsKey = "seenProjects";

const yokaiList = [
  { name: "Akuma", icon: "dog" },
  { name: "Asobibi", icon: "dog" },
  { name: "Bakebi", icon: "dog" },
  { name: "Bakeneko", icon: "bear" },
  { name: "Baku", icon: "bear" },
  { name: "Daki", icon: "bear" },
  { name: "Enkō", icon: "ghost" },
  { name: "Fūbo", icon: "ghost" },
  { name: "Genbu", icon: "bird" },
  { name: "Hakuba", icon: "bird" },
  { name: "Hinode", icon: "bird" },
  { name: "Ikuchi", icon: "bird" },
  { name: "Jashin", icon: "bird" },
  { name: "Kappa", icon: "boar" },
  { name: "Kirin", icon: "whales" },
  { name: "Kitsune", icon: "whales" },
  { name: "Kodama", icon: "boar" },
  { name: "Kowai", icon: "boar" },
  { name: "Mononoke", icon: "boar" },
  { name: "Ninko", icon: "boar" },
  { name: "Ōgama", icon: "boar" },
  { name: "Ōkami", icon: "bear" },
  { name: "Oni", icon: "bear" },
  { name: "Raijū", icon: "bear" },
  { name: "Reiki", icon: "bear" },
  { name: "Ryū", icon: "dog" },
  { name: "Saburō", icon: "dog" },
  { name: "Sankai", icon: "turtle" },
  { name: "Sankibō", icon: "turtle" },
  { name: "Sarugami", icon: "dog" },
  { name: "Satori", icon: "dragon" },
  { name: "Shiryō", icon: "dragon" },
  { name: "Shisa", icon: "dragon" },
  { name: "Sōgenbi", icon: "dragon" },
  { name: "Sōjōbō", icon: "dragon" },
  { name: "Son Gokū", icon: "dragon" },
  { name: "Taiba", icon: "dragon" },
  { name: "Tanuki", icon: "dragon" },
  { name: "Tatsu", icon: "fox" },
  { name: "Tengubi", icon: "fox" },
  { name: "Tenji", icon: "fox" },
  { name: "Tenko", icon: "fox" },
  { name: "Tōtetsu", icon: "fox" },
  { name: "Uba Ga Hi", icon: "fox" },
  { name: "Ubume", icon: "fox" },
  { name: "Uryû", icon: "whales" },
  { name: "Uwan", icon: "fox" },
  { name: "Waira", icon: "frog" },
  { name: "Yōko", icon: "frog" },
  { name: "Yōsei", icon: "frog" },
  { name: "Yosuzume", icon: "rabbit" },
  { name: "Yukinko", icon: "rabbit" },
  { name: "Yurei", icon: "rabbit" },
  { name: "Zan", icon: "frog" },
  { name: "Zorigami", icon: "frog" },
  { name: "Zuijin", icon: "frog" }
];

const initializeUsername = () => {
  // retrieve last username if exists
  const username = localStorage.getItem(lsUsernameKey);
  if (username) {
    return username;
  }

  // generate username
  const randIdx = Math.floor(Math.random() * yokaiList.length);
  const generatedUsername = yokaiList[randIdx].name;
  localStorage.setItem(lsUsernameKey, generatedUsername);
  return generatedUsername;
};

const initializeSeenProjects = () => {
  const seenProjectsJson = localStorage.getItem(lsSeenProjectsKey);
  if (seenProjectsJson) {
    return JSON.parse(seenProjectsJson);
  }
  return [];
};

export const UserStore: BakuModule<UserState> = {
  namespaced: true,
  state: {
    username: initializeUsername(),
    seenProjects: initializeSeenProjects()
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
    },
    changeUsername(state, username: string) {
      state.username = username;
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
      await context.commit("updateSeenProjects", updatedSeenProjects);
    },
    async deleteProject(context, projectId: string) {
      const toDelete = context.state.seenProjects.find(s => s.id === projectId);
      if (toDelete) {
        await deleteProject(toDelete.adminId || toDelete.id);
        await context.commit("deleteSeenProject", toDelete);
      }
    },
    async deleteSeenProject(context, projectId: string) {
      const toDelete = context.state.seenProjects.find(s => s.id === projectId);
      if (toDelete) {
        await context.commit("deleteSeenProject", toDelete);
      }
    },
    async updateUsername(context, name: string) {
      await context.commit("changeUsername", name);
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
        };

        await context.commit("addSeenProject", project);
      }
    }
  },
  getters: {
    getPersonalisedProjectTitle: state => {
      const prefix = "Film de " + state.username;
      let suffixNumber = 0;
      let suffix = "";
      const titles = state.seenProjects.map(p => p.title).sort();
      for (const seenTitle of titles) {
        if (prefix + suffix === seenTitle) {
          suffixNumber += 1;
          suffix = " (" + suffixNumber + ")";
        }
      }
      return prefix + suffix;
    },

    getIcon: (state) => {
      return yokaiList.find(yokai => yokai.name === state.username)?.icon
    }
  }
};
