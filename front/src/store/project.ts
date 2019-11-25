import {Film, FilmService, ImageRef} from "@/api/film-service";
import { BakuEvent } from '@/api/baku-service';

interface ProjectState {
  pictures: string[];
  fullResPicturesCache: HTMLImageElement[];
  id: string;
  activeFrame: number;
  history: BakuEvent[]
}

export const ProjectStore = {
  namespaced: true,
  state: {
    pictures: [],
    fullResPicturesCache: [],
    film: null,
    id: null,
    activeFrame: 0,
    history: []
  },
  mutations: {
    setFilm(state: ProjectState, payload: { projectId: string, filmHistory: BakuEvent[] }) {
      state.id = payload.projectId;
      state.history = payload.filmHistory;
      state.activeFrame = 0;
    },
    addToLocalHistory(state: ProjectState, event: BakuEvent) {
      state.history.push(event);
    },
  },
  actions: {
    async loadProject(context: any, projectId: string) {
      const filmService = new FilmService();
      // const film = await filmService.get(projectId);
      const filmHistory = await filmService.getHistory(projectId);
      await context.commit("setFilm", {projectId, filmHistory});
    },
    async addImageToPlan( context: {commit: any, state: ProjectState}, payload: { planId: string, imageIndex: number, image: ImageRef }) {
       const insertEvent = await new FilmService().insertImage(
        context.state.id,
        payload.planId,
        payload.imageIndex,
        payload.image
      );
      context.commit("addToLocalHistory", insertEvent);
    },
  },
  getters: {
    getPictures: (state: ProjectState) => state.pictures,
    film: (state: ProjectState) => {
      return FilmService.merge(state.history, state.id);
    },
    getPlan: (state: ProjectState) => (id: string) =>  FilmService.merge(state.history, state.id).plans.find(plan => plan.id === id)
  },
  modules: {},
};
