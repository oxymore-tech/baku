import {
  MovieService, Movie, Shot,
} from '@/api/movie.service';
import { BakuEvent, ImageRef } from '@/api/baku.service';

interface ProjectState {
  pictures: string[];
  fullResPicturesCache: HTMLImageElement[];
  id: string;
  activeShotIndex: number;
  history: BakuEvent[];
}

export const ProjectStore = {
  namespaced: true,
  state: {
    pictures: [],
    fullResPicturesCache: [],
    id: null,
    activeShotIndex: 0,
    history: [],
  },
  mutations: {
    setMovie(state: ProjectState, payload: { projectId: string, movieHistory: BakuEvent[] }) {
      state.id = payload.projectId;
      state.history = payload.movieHistory;
      state.activeFrame = 0;
    },
    addToLocalHistory(state: ProjectState, event: BakuEvent) {
      state.history.push(event);
    },
    changeActiveShot(state: ProjectState, shotIndex: number) {
      state.activeShotIndex = shotIndex;
    },
  },
  actions: {
    async loadProject(context: any, projectId: string): Promise<void> {
      const movieService = new MovieService();
      // const movie = await movieService.get(projectId);
      const movieHistory = await movieService.getHistory(projectId);
      await context.commit('setMovie', { projectId, movieHistory });
    },
    async addImageToShot(context: any,
      payload: { shotId: string, imageIndex: number, image: ImageRef }): Promise<void> {
      const insertEvent = await new MovieService().insertImage(
        context.state.id,
        payload.shotId,
        payload.imageIndex,
        payload.image,
        context.rootState.user.username
      );
      context.commit('addToLocalHistory', insertEvent);
    },
    changeActiveShot(context: any, shotIndex: number) {
      context.commit('changeActiveShot', shotIndex);
    },

    async updateTitle(context: any, title: string) {
      const event = await new MovieService().updateTitle(context.state.id, title, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },

    async updateSynopsis(context: any, synopsis: string) {
      const event = await new MovieService().updateSynopsis(context.state.id, synopsis, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },

    async createShot(context: any, name = 'Default shot'): Promise<void> {
      const createEvent = await new MovieService().addShot(context.state.id, name, context.rootState.user.username);
      console.log(context);
      context.commit('addToLocalHistory', createEvent);
    },
    async renameShot(context: any, { shotId, name }: Record<string, string>): Promise<void> {
      const event = await new MovieService().renameShot(context.state.id, shotId, name, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },
  },
  getters: {
    getPictures: (state: ProjectState) => state.pictures,
    movie: (state: ProjectState): Movie => MovieService.merge(state.history),
    getActiveShot: (state: ProjectState, getters: any): Shot => getters.movie.shots[state.activeShotIndex],
    getActiveShotId: (state: ProjectState, getters: any): string => getters.getActiveShot ? getters.getActiveShot.id : undefined,
  },
  modules: {},
};
