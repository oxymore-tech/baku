import { FilmService, ImageRef } from '@/api/film-service';
import { BakuEvent } from '@/api/baku-service';

interface ProjectState {
  pictures: string[];
  fullResPicturesCache: HTMLImageElement[];
  id: string;
  activeFrame: number;
  activePlanIndex: number;
  history: BakuEvent[]
}

export const ProjectStore = {
  namespaced: true,
  state: {
    pictures: [],
    fullResPicturesCache: [],
    id: null,
    activeFrame: 0,
    activePlanIndex: 0,
    history: [],
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
    changeActivePlan(state: ProjectState, planIndex: number) {
      state.activePlanIndex = planIndex;
    },
    goToNextFrame(state: ProjectState) {
      if (state.activeFrame === FilmService.merge(state.history, state.id).plans[state.activePlanIndex].images.length - 1) {
        state.activeFrame = 0;
      } else {
        state.activeFrame++;
      }
    },
  },
  actions: {
    async loadProject(context: any, projectId: string) {
      const filmService = new FilmService();
      // const film = await filmService.get(projectId);
      const filmHistory = await filmService.getHistory(projectId);
      await context.commit('setFilm', { projectId, filmHistory });
    },
    async addImageToPlan(context: { commit: any, state: ProjectState },
      payload: { planId: string, imageIndex: number, image: ImageRef }) {
      const insertEvent = await new FilmService().insertImage(
        context.state.id,
        payload.planId,
        payload.imageIndex,
        payload.image,
      );
      context.commit('addToLocalHistory', insertEvent);
    },
    changeActivePlan(context: any, planIndex: number) {
      context.commit('changeActivePlan', planIndex);
    },
    goToNextFrameAction(context: any) {
      context.commit('goToNextFrame');
    },
    async createPlan(context: { commit: any, state: ProjectState }, name = "Default plan") {
      const createEvent = await new FilmService().addPlan(context.state.id, name);
      context.commit('addToLocalHistory', createEvent);
    },
  },
  getters: {
    getPictures: (state: ProjectState) => state.pictures,
    film: (state: ProjectState) => FilmService.merge(state.history, state.id),
    getActivePlan: (state: ProjectState) => FilmService.merge(state.history, state.id).plans[state.activePlanIndex],
    getActivePlanId: (_state: ProjectState, getters: any) => getters.getActivePlan.id,
  },
  modules: {},
};
