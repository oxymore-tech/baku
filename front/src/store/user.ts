import store from "@/store";
import { BakuModule, SeenProject, UserState } from "./store.types";
import { deleteProject, getHistory } from "@/api";
import { MovieService } from "@/utils/movie.service";

// local storage keys
const lsUsernameKey = "username";
const lsUsercolorKey = "usercolor";
const lsSeenProjectsKey = "seenProjects";

var CACHE = {
	name: 'Baku-cache',
	version: 'v1'
};

const colorList = [
  "#E74C3C",
  "#FFBD72",
  "#FFE184",
  "#8EE4AF",
  "#7FC6BC",
  "#CAFAFE",
  "#3DB6D6",
  "#04518C",
  "#553D67",
  "#FE676F"
];

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

const initializeColor = () => {
  // retrieve last username if exists
  const usercolor = localStorage.getItem(lsUsercolorKey);
  if (usercolor) {
    return usercolor;
  }

  // generate username
  const randIdx = Math.floor(Math.random() * colorList.length);
  localStorage.setItem(lsUsercolorKey,  colorList[randIdx]);
  return  colorList[randIdx];
}

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
    usercolor: initializeColor(),
    seenProjects: initializeSeenProjects()
  },
  mutations: {
    updateSeenProjects(state: { seenProjects: SeenProject[]; }, seenProjects: SeenProject[]) {
      localStorage.setItem(lsSeenProjectsKey, JSON.stringify(seenProjects));
      state.seenProjects = MovieService.removeDoublons(seenProjects);
    },
    addSeenProject(state: { seenProjects: SeenProject[]; }, project: SeenProject) {
      const newSeenProjects = MovieService.removeDoublons([project, ...state.seenProjects]);
      localStorage.setItem(lsSeenProjectsKey, JSON.stringify(newSeenProjects));
      state.seenProjects = newSeenProjects;
    },
    deleteSeenProject(state: { seenProjects: any[]; }, toDelete: SeenProject) {
      const toDeleteIndex = state.seenProjects.findIndex((s: { id: string; }) => s.id == toDelete.id);
      if (toDeleteIndex > -1) {
        state.seenProjects.splice(toDeleteIndex, 1);
        localStorage.setItem(lsSeenProjectsKey, JSON.stringify(state.seenProjects));
      }
    },
    changeUsername(state: { username: string; }, username: string) {
      state.username = username;
    }
  },
  actions: {
    async refreshSeenProjectsMetadata(context: { state: { seenProjects: any; }; commit: (arg0: string, arg1: any[]) => any; }) {
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
    async deleteProject(context: { state: { seenProjects: any[]; }; commit: (arg0: string, arg1: any) => any; }, projectId: string) {
      const toDelete = context.state.seenProjects.find((s: { id: string; }) => s.id === projectId);
      
      if (toDelete) {
        await deleteProject(toDelete.adminId || toDelete.id);
        await context.commit("deleteSeenProject", toDelete);
        caches.delete("/api/"+projectId+"/history");   

      }
    },
    async deleteSeenProject(context: { state: { seenProjects: any[]; }; commit: (arg0: string, arg1: any) => any; }, projectId: string) {
      const toDelete = context.state.seenProjects.find((s: { id: string; }) => s.id === projectId);
      
      if (toDelete) {
        await context.commit("deleteSeenProject", toDelete);
        caches.open(CACHE.name+CACHE.version).then((cache) => {
          cache.delete("/api/"+projectId+"/history");
          cache.delete("/api/"+projectId+"/video/status");        //Deleting cached files in related to project      
                 
        }
        )
      }
    },
    async updateUsername(context: { commit: (arg0: string, arg1: string) => any; }, name: string) {
      await context.commit("changeUsername", name);
    },
    async updateCurrentSeenProject(context: { commit: (arg0: string, arg1: SeenProject) => any; }) {
      let projectId = store.state.project.id;
      if (projectId && projectId.search(/[a-zA-Z]/) >= 0) {
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
    getPersonalisedProjectTitle: (state: { username: string; seenProjects: any[]; }) => {
      const prefix = "Film de " + state.username;
      let suffixNumber = 0;
      let suffix = "";
      const titles = state.seenProjects.map((p: { title: any; }) => p.title).sort();
      for (const seenTitle of titles) {
        if (prefix + suffix === seenTitle) {
          suffixNumber += 1;
          suffix = " (" + suffixNumber + ")";
        }
      }
      return prefix + suffix;
    },

    getIcon: (state: { username: string; }) => {
      return yokaiList.find(yokai => yokai.name === state.username)?.icon
    }
  }
};
