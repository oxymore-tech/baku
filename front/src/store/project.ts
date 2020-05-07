import store from "@/store";
import * as api from '@/api';
import { BakuAction, BakuEvent } from '@/utils/types';
import { Movie, MovieService, Shot } from '@/utils/movie.service';
import { BakuActionContext, BakuModule, ProjectState } from '@/store/store.types';
import uuid from 'uuid';

interface ProjectGetters {
  movie: Movie;
  getActiveShot: Shot;
  canEdit: boolean;
}

const makeEvent = (context: BakuActionContext<ProjectState>, action: BakuAction, value: any) => {
  return {
    action,
    value,
    user: context.rootState.user.username,
    timestamp: new Date(),
  }
}

const loadEvents = (
  context: BakuActionContext<ProjectState>,
  events: BakuEvent[]): void => {

    console.log(events)
    const promise = api.stack(context.state.id, events);

    events.map(event => {
      context.commit('addToLocalHistory', event);
      context.commit('incAction', 1);
      promise.catch(() => context.commit('removeFromLocalHistory', event))
        .finally(() => context.commit('incAction', -1));
    })
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
      if (state.pendingActions > 0) {
        state.pendingActions += count;
      }
    },
  },
  actions: {
    async loadProject(context, projectId: string): Promise<void> {
      const movieHistory = await api.getHistory(projectId);
      await context.commit('setMovie', { projectId, movieHistory });
    },
    async addImagesToShot(context, values: any[]): Promise<void> {
      const events = values.map(value => makeEvent(context, BakuAction.MOVIE_INSERT_IMAGE, value));
      loadEvents(context, events);
      store.dispatch('user/updateSeenProjects');
    },
    async removeImagesFromShot(context, values: any[]) {
      const events = values.map(value => makeEvent(context, BakuAction.MOVIE_REMOVE_IMAGE, value));
      loadEvents(context, events);
      store.dispatch('user/updateSeenProjects');
    },

    changeActiveShot(context, shotIndex: number) {
      context.commit('changeActiveShot', shotIndex);
    },

    async updateTitle(context, title: string) {
      const event = makeEvent(context, BakuAction.MOVIE_UPDATE_TITLE, title);
      loadEvents(context, [event]);
    },

    async updateSynopsis(context, synopsis: string) {
      const event = makeEvent(context, BakuAction.MOVIE_UPDATE_SYNOPSIS, synopsis);
      console.log("update syno")
      loadEvents(context, [event]);
    },

    async createShot(context): Promise<string> {
      const shotId = uuid.v4();
      const event = makeEvent(context, BakuAction.SHOT_ADD, { shotId });
      loadEvents(context, [event]);
      return shotId;
    },

    async removeShot(context, shotId: string) {
      const event = makeEvent(context, BakuAction.SHOT_REMOVE, { shotId });
      loadEvents(context, [event]);
      store.dispatch('user/updateSeenProjects');
    },

    async changeFps(context, fps: number): Promise<void> {
      const event = makeEvent(context, BakuAction.CHANGE_FPS, fps);
      loadEvents(context, [event]);
    },

    async lockMovie(context): Promise<void> {
      const event = makeEvent(context, BakuAction.MOVIE_LOCK, context.getters.movie.locked);
      loadEvents(context, [event]);
    },

    async lockShot(context, params: { shotId: string, locked: boolean }): Promise<void> {
      const event = makeEvent(context, BakuAction.MOVIE_LOCK, params);
      loadEvents(context, [event]);
    },

    async changeShotSynposis(context,  params: { shotId: string, synopsis: string }){
      const event = makeEvent(context, BakuAction.SHOT_UPDATE_SYNOPSIS, params);
      loadEvents(context, [event]);
    },

    async changeShotStoryboard(context,  params: { shotId: string, storyboard: string }){
      const event = makeEvent(context, BakuAction.SHOT_UPDATE_STORYBOARD, params);
      loadEvents(context, [event]);
    }
  },
  getters: {
    movie: (state): Movie =>
    MovieService.merge(state.id, state.history),

    getActiveShot: (state, getters: ProjectGetters): Shot | undefined =>
    getters.movie.shots.find((shot: Shot) => shot.id === state.activeShotId),

    getActiveShotImgCount: (state, getters: ProjectGetters): number | undefined =>
    (getters.getActiveShot ? getters.getActiveShot.images.length : 0),

    synchronizing: (state): boolean =>
    state.pendingActions !== 0,

    canEditMovie: (state, getters: ProjectGetters): boolean =>
    !getters.movie.locked,

    canEditActiveShot: (state, getters: ProjectGetters): boolean =>
    !getters.movie.locked && !getters.getActiveShot.locked,

    canLock: (state): boolean =>
    (state.id).length > 36,

    getNoEditId: (state, getters: ProjectGetters): string => getters.canEdit ? state.id.slice(0,36) : state.id,

    getPreviousShotId: (state, getters: ProjectGetters): string | undefined => {
      console.log(getters.movie.shots);
      let activeShotId = getters.getActiveShot.id;
      let previousShotId = getters.movie.shots[getters.movie.shots.length - 1].id;

      for(let i = 0, i_len = getters.movie.shots.length; i < i_len; i++) {
        if(getters.movie.shots[i].id == activeShotId) {
          break;
        }
        previousShotId  = getters.movie.shots[i].id;
      }

      return previousShotId;
    },

    getNextShotId: (state, getters: ProjectGetters): string | undefined => {
      let activeShotId = getters.getActiveShot.id;
      let nextShotId = getters.movie.shots[0].id;

      for(let i = getters.movie.shots.length -1; i >= 0; i--) {
        if(getters.movie.shots[i].id == activeShotId) {
          break;
        }
        nextShotId  = getters.movie.shots[i].id;
      }

      return nextShotId;
    },

    getShotCount: (state, getters: ProjectGetters): number | undefined => {
      return getters.movie.shots.length;
    },

    getActiveShotIndex: (state, getters: ProjectGetters): number | undefined => {
      return getters.movie.shots.findIndex((shot: Shot) => shot.id === getters.getActiveShot?.id);
    },
  },
  modules: {},
};
