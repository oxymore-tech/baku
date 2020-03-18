import { Module } from 'vuex';
import { Movie, MovieService, Shot } from '@/api/movie.service';
import { BakuEvent } from '@/api/baku.service';

const movieService = new MovieService();

interface ProjectState {
  id: string;
  activeShotId: string | null;
  history: BakuEvent[];
  pendingActions: number;
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
    pendingActions: 0,
  },
  mutations: {
    setMovie(state, payload: { projectId: string, movieHistory: BakuEvent[] }) {
      state.id = payload.projectId;
      state.history = payload.movieHistory;
    },
    addToLocalHistory(state, event: BakuEvent) {
      state.history.push(event);
    },
    removeFromLocalHistory(state, event: BakuEvent) {
      const eventIdx = state.history.findIndex((historyEvent) => historyEvent === event);
      state.history.splice(eventIdx, 1);
    },
    changeActiveShot(state, shotId: string) {
      state.activeShotId = shotId;
    },
    incAction(state, count: number) {
      state.pendingActions += count;
    },
  },
  actions: {
    async loadProject(context: any, projectId: string): Promise<void> {
      const movieHistory = await movieService.getHistory(projectId);
      await context.commit('setMovie', { projectId, movieHistory });
    },
    async addImageToShot(context: any,
      payload: { shotId: string, imageIndex: number, image: string }): Promise<void> {
      const [event, promise] = movieService.insertImage(
        context.state.id,
        payload.shotId,
        payload.imageIndex,
        payload.image,
        context.rootState.user.username,
      );
      context.commit('addToLocalHistory', event);
      context.commit('incAction', 1);
      promise.catch(() => context.commit('removeFromLocalHistory', event))
        .finally(() => context.commit('incAction', -1));
    },
    async removeImageFromShot(context: any,
      payload: { shotId: string, imageIndex: number }) {
      const [event, promise] = movieService.removeImage(
        context.state.id,
        payload.shotId,
        payload.imageIndex,
        context.rootState.user.username,
      );
      context.commit('addToLocalHistory', event);
      context.commit('incAction', 1);
      promise.catch(() => context.commit('removeFromLocalHistory', event))
        .finally(() => context.commit('incAction', -1));
    },
    changeActiveShot(context, shotIndex: number) {
      context.commit('changeActiveShot', shotIndex);
    },

    async updateTitle(context: any, title: string) {
      const [event, promise] = await movieService.updateTitle(context.state.id, title, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
      context.commit('incAction', 1);
      promise.catch(() => context.commit('removeFromLocalHistory', event))
        .finally(() => context.commit('incAction', -1));
    },

    async updateSynopsis(context: any, synopsis: string) {
      const [event, promise] = await movieService.updateSynopsis(context.state.id, synopsis, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
      context.commit('incAction', 1);
      promise.catch(() => context.commit('removeFromLocalHistory', event))
        .finally(() => context.commit('incAction', -1));
    },

    async createShot(context: any, _name = 'Default shot'): Promise<string> {
      const [event, promise] = await movieService.addShot(context.state.id, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
      context.commit('incAction', 1);
      promise.catch(() => context.commit('removeFromLocalHistory', event))
        .finally(() => context.commit('incAction', -1));
      return event.value.shotId;
    },

    async changeFps(context: any, fps: number): Promise<void> {
      const [event, promise] = await movieService.changeFps(context.state.id, fps, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
      context.commit('incAction', 1);
      promise.catch(() => context.commit('removeFromLocalHistory', event))
        .finally(() => context.commit('incAction', -1));
    },
  },
  getters: {
    history: (state: ProjectState): BakuEvent[] => state.history,

    movie: (state: ProjectState): Movie => MovieService.merge(state.id, state.history),
    getActiveShot: (state: ProjectState, getters: ProjectGetters): Shot | undefined => getters.movie.shots.find((shot: Shot) => shot.id === state.activeShotId),
    synchronizing: (state: ProjectState): boolean => state.pendingActions !== 0,
  },
  modules: {},
};
