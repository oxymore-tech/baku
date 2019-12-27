import { Module } from 'vuex';
import { Movie, MovieService, Shot } from '@/api/movie.service';
import { BakuEvent } from '@/api/baku.service';

const movieService = new MovieService();

interface ProjectState {
  id: string;
  activeShotId: string | null;
  history: BakuEvent[];
  selectedImages: number[];
}

interface ProjectGetters {
  movie: Movie;
  getActiveShot: Shot;
}

export const ProjectStore: Module<ProjectState, any> = {
  namespaced: true,
  state: {
    id: '',
    activeShotId: null,
    history: [],
    selectedImages: [0, 2],
  },
  mutations: {
    setMovie(state, payload: { projectId: string, movieHistory: BakuEvent[] }) {
      state.id = payload.projectId;
      state.history = payload.movieHistory;
    },
    addToLocalHistory(state, event: BakuEvent) {
      state.history.push(event);
    },
    changeActiveShot(state, shotId: string) {
      state.activeShotId = shotId;
    },
    setSelectedImages(state, newImagesSelection: number[]) {
      state.selectedImages = newImagesSelection;
    },
  },
  actions: {
    async loadProject(context: any, projectId: string): Promise<void> {
      const movieHistory = await movieService.getHistory(projectId);
      await context.commit('setMovie', { projectId, movieHistory });
    },
    async addImageToShot(context: any,
      payload: { shotId: string, imageIndex: number, image: string }): Promise<void> {
      const insertEvent = await new MovieService().insertImage(
        context.state.id,
        payload.shotId,
        payload.imageIndex,
        payload.image,
        context.rootState.user.username,
      );
      context.commit('addToLocalHistory', insertEvent);
    },
    changeActiveShot(context, shotIndex: number) {
      context.commit('changeActiveShot', shotIndex);
    },

    async updateTitle(context: any, title: string) {
      const event = await movieService.updateTitle(context.state.id, title, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },

    async updateSynopsis(context: any, synopsis: string) {
      const event = await movieService.updateSynopsis(context.state.id, synopsis, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },

    async createShot(context: any, _name = 'Default shot'): Promise<string> {
      const createEvent = await movieService.addShot(context.state.id, context.rootState.user.username);
      context.commit('addToLocalHistory', createEvent);
      return createEvent.value.shotId;
    },

    async changeFps(context: any, fps: number): Promise<void> {
      const event = await movieService.changeFps(context.state.id, fps, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },

  },
  getters: {
    movie: (state: ProjectState): Movie => MovieService.merge(state.id, state.history),
    getActiveShot: (state: ProjectState, getters: ProjectGetters): Shot | undefined => getters.movie.shots.find((shot: Shot) => shot.id === state.activeShotId),
  },
  modules: {},
};
