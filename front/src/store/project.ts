import store from "@/store";
import * as api from '@/api';
import { BakuAction, BakuEvent, Duration } from '@/utils/types';
import { Movie, MovieService, Shot } from '@/utils/movie.service';
import { BakuActionContext, BakuModule, ProjectState } from '@/store/store.types';
import uuid from 'uuid';

interface ProjectGetters {
  movie: Movie;
  getActiveShot: Shot;
  canLock: boolean;
}

export function computeSeconds(imageNumber: number, fps: number): number {
  return Math.floor(imageNumber / fps) % 60;
}

export function computeMinutes(imageNumber: number, fps: number): number {
  return Math.floor(imageNumber / fps / 60) % 60;
}

export function computeHours(imageNumber: number, fps: number): number {
  return Math.floor(imageNumber / fps / 60 / 60) % 60;
}

const makeEvent = (context: BakuActionContext<ProjectState>, action: BakuAction, value: any) => {
  return {
    action,
    value,
    user: context.rootState.user.username,
    timestamp: new Date(),
  }
}

function loadEvents(context: BakuActionContext<ProjectState>, events: BakuEvent[]): void {

  const promise = api.stack(context.state.id, events);

  events.map(event => {
    context.commit('addToLocalHistory', event);
    context.commit('incAction', 1);
    promise.catch(() => context.commit('removeFromLocalHistory', event))
      .finally(() => context.commit('incAction', -1));
  })
}

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
      await context.commit('setMovie', {projectId, movieHistory});
      await store.dispatch('user/updateCurrentSeenProject');
    },
    async addImagesToShot(context, values: any[]): Promise<void> {
      const events = values.map(value => makeEvent(context, BakuAction.MOVIE_INSERT_IMAGE, value));
      loadEvents(context, events);
      await store.dispatch('user/updateCurrentSeenProject');
    },
    async removeImagesFromShot(context, values: any[]) {
      const events = values.map(value => makeEvent(context, BakuAction.MOVIE_REMOVE_IMAGE, value));
      loadEvents(context, events);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async reverseImages(context, values: { shotId: string, imageIndexLeft: number, imageIndexRight: number }) {
      const events = makeEvent(context, BakuAction.MOVIE_REVERSE_IMAGES, values);
      loadEvents(context, [events]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    changeActiveShot(context, shotIndex: number) {
      context.commit('changeActiveShot', shotIndex);
    },

    async updateTitle(context, {projectId, title}) {
      const event = makeEvent(context, BakuAction.MOVIE_UPDATE_TITLE, title);
      await api.stack(projectId, [event]);
    },

    async updateSynopsis(context, {projectId, synopsis}) {
      const event = makeEvent(context, BakuAction.MOVIE_UPDATE_SYNOPSIS, synopsis);
      await api.stack(projectId, [event]);
    },

    async changeFps(context, {projectId, fps}) {
      const event = makeEvent(context, BakuAction.CHANGE_FPS, fps);
      await api.stack(projectId, [event]);
    },

    async createShot(context): Promise<string> {
      const shotId = uuid.v4();
      const event = makeEvent(context, BakuAction.SHOT_ADD, {shotId});
      loadEvents(context, [event]);
      store.dispatch('user/updateCurrentSeenProject');
      return shotId;
    },

    async removeShot(context, shotId: string) {
      const event = makeEvent(context, BakuAction.SHOT_REMOVE, {shotId});
      loadEvents(context, [event]);
      store.dispatch('user/updateCurrentSeenProject');
    },

    async lockMovie(context, {projectId, locked}): Promise<void> {
      const event = makeEvent(context, BakuAction.MOVIE_LOCK, locked);
      await api.stack(projectId, [event]);
    },

    async lockShot(context, params: { shotId: string, locked: boolean }): Promise<void> {
      const event = makeEvent(context, BakuAction.SHOT_LOCK, params);
      loadEvents(context, [event]);
    },

    async changeShotSynopsis(context, params: { shotId: string, synopsis: string }) {
      const event = makeEvent(context, BakuAction.SHOT_UPDATE_SYNOPSIS, params);
      loadEvents(context, [event]);
    },

    async changeShotStoryboard(context, params: { shotId: string, storyboard: string }) {
      const event = makeEvent(context, BakuAction.SHOT_UPDATE_STORYBOARD, params);
      loadEvents(context, [event]);
    }
  },
  getters: {
    movie: (state): Movie =>
      MovieService.merge(state.id, state.history),

    getMovieFps: (state, getters: ProjectGetters): number | undefined => getters.movie.fps,

    getActiveShot: (state, getters: ProjectGetters): Shot | undefined =>
      getters.movie.shots.find((shot: Shot) => shot.id === state.activeShotId),

    getActiveShotImgCount: (state, getters: ProjectGetters): number | undefined =>
      (getters.getActiveShot ? getters.getActiveShot.images.length : 0),

    synchronizing: (state): boolean =>
      state.pendingActions !== 0,

    canEditMovie: (state, getters: ProjectGetters): boolean =>
      !getters.movie.locked,

    canEditActiveShot: (state, getters: ProjectGetters): boolean =>
      !getters.movie.locked && (!getters.getActiveShot?.locked),

    canUnLock: (state): boolean =>
      (state.id).length > 36,

    getNoEditId: (state, getters: ProjectGetters): string => getters.canLock ? state.id.slice(0, 36) : state.id,

    getPreviousShotId: (state, getters: ProjectGetters): string | undefined => {
      let activeShotId = getters.getActiveShot.id;
      let previousShotId = getters.movie.shots[getters.movie.shots.length - 1].id;

      for (let i = 0, i_len = getters.movie.shots.length; i < i_len; i++) {
        if (getters.movie.shots[i].id == activeShotId) {
          break;
        }
        previousShotId = getters.movie.shots[i].id;
      }

      return previousShotId;
    },

    getNextShotId: (state, getters: ProjectGetters): string | undefined => {
      let activeShotId = getters.getActiveShot.id;
      let nextShotId = getters.movie.shots[0].id;

      for (let i = getters.movie.shots.length - 1; i >= 0; i--) {
        if (getters.movie.shots[i].id == activeShotId) {
          break;
        }
        nextShotId = getters.movie.shots[i].id;
      }

      return nextShotId;
    },

    getShotCount: (state, getters: ProjectGetters): number | undefined => {
      return getters.movie.shots.length;
    },

    getActiveShotIndex: (state, getters: ProjectGetters): number | undefined => {
      return getters.movie.shots.findIndex((shot: Shot) => shot.id === getters.getActiveShot?.id);
    },

    getImageCount: (state, getters: ProjectGetters): number => {
      let res = 0
      for (let i = 0, i_len = getters.movie.shots.length; i < i_len; i++) {
        res += getters.movie.shots[i].images.length
      }
      return res
    },

    getHours: (state, getters): any =>
      (shotIndex: number | undefined): any => {
        let imgNb: number
        if (shotIndex != undefined) {
          imgNb = getters.movie.shots[shotIndex].images.length
        } else {
          imgNb = getters.getImageCount
        }
        return computeHours(imgNb, getters.movie.fps)
      },

    getMinutes: (state, getters): any =>
      (shotIndex: number | undefined): any => {
        let imgNb: number
        if (shotIndex != undefined) {
          imgNb = getters.movie.shots[shotIndex].images.length
        } else {
          imgNb = getters.getImageCount
        }
        return computeMinutes(imgNb, getters.movie.fps)
      },

    getSeconds: (state, getters): any =>
      (shotIndex: number | undefined): any => {
        let imgNb: number
        if (shotIndex != undefined) {
          imgNb = getters.movie.shots[shotIndex].images.length
        } else {
          imgNb = getters.getImageCount
        }
        return computeSeconds(imgNb, getters.movie.fps)
      },

    movieDuration: (state, getters): Duration => {
      return {
        hours: getters.getHours(),
        minutes: getters.getMinutes(),
        seconds: getters.getSeconds(),
      }
    },

  },
  modules: {},
};
