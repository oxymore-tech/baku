import { BakuAction, BakuEvent, BakuService } from '@/api/baku.service';
import { Movie, MovieService, Shot } from '@/api/movie.service';
import { BakuActionContext, BakuModule, ProjectState } from '@/store/store.types';
import uuid from 'uuid';

const bakuService = new BakuService();

interface ProjectGetters {
  movie: Movie;
  getActiveShot: Shot;
}

const loadEvent = (context: BakuActionContext<ProjectState>, action: BakuAction, value: any): void => {
  const user = context.rootState.user.username;
  const projectId = context.state.id;
  const event = {
    action, value, user, timestamp: new Date(),
  };
  const promise = bakuService.stack(projectId, event);
  context.commit('addToLocalHistory', event);
  context.commit('incAction', 1);
  promise.catch(() => context.commit('removeFromLocalHistory', event))
    .finally(() => context.commit('incAction', -1));
};

export const ProjectStore: BakuModule<ProjectState> = {
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
    async loadProject(context, projectId: string): Promise<void> {
      const movieHistory = await bakuService.getHistory(projectId);
      await context.commit('setMovie', { projectId, movieHistory });
    },
    async addImageToShot(context,
      payload: { shotId: string, imageIndex: number, image: string }): Promise<void> {
      loadEvent(context, BakuAction.MOVIE_INSERT_IMAGE, payload);
    },
    async removeImageFromShot(context,
      payload: { shotId: string, imageIndex: number }) {
      loadEvent(context, BakuAction.MOVIE_REMOVE_IMAGE, payload);
    },

    changeActiveShot(context, shotIndex: number) {
      context.commit('changeActiveShot', shotIndex);
    },

    async updateTitle(context, title: string) {
      loadEvent(context, BakuAction.MOVIE_UPDATE_TITLE, title);
    },

    async updateSynopsis(context, synopsis: string) {
      loadEvent(context, BakuAction.MOVIE_UPDATE_SYNOPSIS, synopsis);
    },

    async createShot(context): Promise<string> {
      const shotId = uuid.v4();
      loadEvent(context, BakuAction.SHOT_ADD, { shotId });
      return shotId;
    },

    async removeShot(context, shotId: string) {
      loadEvent(context, BakuAction.SHOT_REMOVE, { shotId });
    },

    async changeFps(context, fps: number): Promise<void> {
      loadEvent(context, BakuAction.CHANGE_FPS, fps);
    },
  },
  getters: {
    history: (state): BakuEvent[] => state.history,
    movie: (state): Movie => MovieService.merge(state.id, state.history),
    getActiveShot: (state, getters: ProjectGetters): Shot | undefined => getters.movie.shots.find((shot: Shot) => shot.id === state.activeShotId),
    getActiveShotImgCount: (state, getters: ProjectGetters): number | undefined => (getters.getActiveShot ? getters.getActiveShot.images.length : 0),
    synchronizing: (state): boolean => state.pendingActions !== 0,
  },
  modules: {},
};
