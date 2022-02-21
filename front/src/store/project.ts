import store from "@/store";
import * as api from '@/api';
import { BakuAction, BakuEvent, Duration } from '@/utils/types';
import { Audio, Movie, MovieService, Shot, SoundTimeline } from '@/utils/movie.service';
import { BakuActionContext, BakuModule, ProjectState } from '@/store/store.types';
import uuid from 'uuid';

interface ProjectGetters {
  movie: Movie;
  getActiveShot: Shot;
  getActiveShotIndex: number;
  canLock: boolean;
  getPreviousShotId: string;
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
  const promise = api.stack(context.state.id, events, context.rootState.socket.socketId);

  events.map(event => {
    context.commit('addToLocalHistory', event);
    context.commit('incAction', 1);
    promise.catch(() => context.commit('removeFromLocalHistory', event))
      .finally(() => context.commit('incAction', -1));
  })
}



/*function loadEvents(context: BakuActionContext<ProjectState>, events: BakuEvent[]): void {
  //const promise = api.stack(context.state.id, events, context.rootState.socket.socketId);

  events.map(event => {
    context.commit('addToLocalHistory', event);
    context.commit('incAction', 1);
    //promise.catch(() => context.commit('removeFromLocalHistory', event))
    //  .finally(() => context.commit('incAction', -1));
  })
}*/

const ProjectStore: BakuModule<ProjectState> = {
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
    addToLocalHistory(state: { history: BakuEvent[]; }, event: BakuEvent) {
      state.history.push(event);
    },
    removeFromLocalHistory(state, event: BakuEvent) {
      const eventIdx = state.history.findIndex((historyEvent: BakuEvent) => historyEvent === event);
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
    emptyState(state) {
      state.id = '';
      state.activeShotId = null,
      state.history = [];
      state.pendingActions = 0;
    }
  },
  actions: {
    async loadProject(context: { rootState: { socket: { socketId: string | undefined; }; }; commit: (arg0: string, arg1: { projectId: string; movieHistory: BakuEvent[]; }) => any; }, projectId: string): Promise<void> {
      const movieHistory = await api.getHistory(projectId, context.rootState.socket.socketId);
      await context.commit('setMovie', {projectId, movieHistory});
      await store.dispatch('user/updateCurrentSeenProject');
    },
    async addImagesToShot(context: any, values: any[]): Promise<void> {
      const events = values.map(value => makeEvent(context, BakuAction.MOVIE_INSERT_IMAGE, value));
      loadEvents(context, events);
      await store.dispatch('user/updateCurrentSeenProject');
    },
    async removeImagesFromShot(context: any, values: any[]) {
      const events = values.map(value => makeEvent(context, BakuAction.MOVIE_REMOVE_IMAGE, value));
      loadEvents(context, events);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async reverseImages(context: any, values: { shotId: string, imageIndexLeft: number, imageIndexRight: number }) {
      const events = makeEvent(context, BakuAction.MOVIE_REVERSE_IMAGES, values);
      loadEvents(context, [events]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    changeActiveShot(context: { commit: (arg0: string, arg1: number) => void; }, shotIndex: number) {
      context.commit('changeActiveShot', shotIndex);
    },

    async updateTitle(context, {projectId, title}: any) {
      const event = makeEvent(context, BakuAction.MOVIE_UPDATE_TITLE, title);
      await api.stack(projectId, [event], context.rootState.socket.socketId);
    },

    async updateSynopsis(context, {projectId, synopsis}: any) {
      const event = makeEvent(context, BakuAction.MOVIE_UPDATE_SYNOPSIS, synopsis);
      await api.stack(projectId, [event], context.rootState.socket.socketId);
    },

    async changeFps(context, {projectId, fps}: any) {
      const event = makeEvent(context, BakuAction.CHANGE_FPS, fps);
      await api.stack(projectId, [event], context.rootState.socket.socketId);
    },

    async createShot(context: any): Promise<string> {
      const shotId = uuid.v4();
      const event = makeEvent(context, BakuAction.SHOT_ADD, {shotId});
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
      return shotId;
    },

    async moveShot(context: any, params: { shotId: string, index: number }): Promise<void> {
      const event = makeEvent(context, BakuAction.SHOT_MOVE, params);
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async removeShot(context: any, shotId: string) {
      const event = makeEvent(context, BakuAction.SHOT_REMOVE, {shotId});
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async lockMovie(context: any, locked: any): Promise<void> {
      const event = makeEvent(context, BakuAction.MOVIE_LOCK, locked);
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async lockShot(context: any, params: { shotId: string, locked: boolean }): Promise<void> {
      const event = makeEvent(context, BakuAction.SHOT_LOCK, params);
      loadEvents(context, [event]);
    },

    async changeShotSynopsis(context: any, params: { shotId: string, synopsis: string }) {
      const event = makeEvent(context, BakuAction.SHOT_UPDATE_SYNOPSIS, params);
      loadEvents(context, [event]);
    },

    async changeShotStoryboard(context: any, params: { shotId: string, storyboard: string }) {
      const event = makeEvent(context, BakuAction.SHOT_UPDATE_STORYBOARD, params);
      loadEvents(context, [event]);
    },

    async emptyState(context: { commit: (arg0: string) => void; }) {
      context.commit('emptyState');
    },

    async addToLocalHistory(context: { commit: (arg0: string, arg1: BakuEvent) => void; }, event: BakuEvent) {
      context.commit('addToLocalHistory', event);
    },

    async createAudio(context: any, params: {title : string, sound : Blob, duration : number, projectId : string}) {
      const audioId = uuid.v4();
      const event = makeEvent(context, BakuAction.AUDIO_ADD, {audioId, params});
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
      await api.uploadSound(params.projectId, params.sound,  audioId);
    },

    async createWav(context: any, params: {title : string, text : string, voice : string, projectId : string}) {
      const audioId = uuid.v4();
      console.log(audioId);
      await api.generateWav(params.projectId, params.text, params.voice, audioId);
      const event = makeEvent(context, BakuAction.AUDIO_ADD_WAV, {audioId, params});
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async removeAudio(context: any, audioId: string) {
      const event = makeEvent(context, BakuAction.AUDIO_REMOVE, {audioId});
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async loadAudioSound(context: any, params : {audioId : string, sound : Blob}) {
      const event = makeEvent(context, BakuAction.AUDIO_UPDATE_SOUND, params);
      loadEvents(context, [event]);
    },

    async changeAudioTitle(context: any, params : {audioId : string, title : string}) {
      const event = makeEvent(context, BakuAction.AUDIO_UPDATE_TITLE, params);
      loadEvents(context, [event]);
    },

    async changeAudioSound(context: any, params : {audioId : string, sound : Blob, projectId : string}) {
      const event = makeEvent(context, BakuAction.AUDIO_UPDATE_SOUND, params);
      loadEvents(context, [event]);
      await api.uploadExistantSound(params.projectId, params.sound,  params.audioId);
    },

    async changeAudioVolume(context: any, params : {audioId : string, volume : number}) {
      const event = makeEvent(context, BakuAction.AUDIO_UPDATE_VOLUME, params);
      loadEvents(context, [event]);
    },

    async changeAudioDuration(context: any, params : {audioId : string, duration : number}) {
      const event = makeEvent(context, BakuAction.AUDIO_UPDATE_DURATION, params);
      loadEvents(context, [event]);
    },

    async changeAudioWaveform(context: any, params : {audioId : string, waveform : Blob}) {
      const event = makeEvent(context, BakuAction.AUDIO_UPDATE_WAVEFORM, params);
      loadEvents(context, [event]);
    },

    async createSoundTimeline(context: any, params: {audioId : String, start : number, end : number, pisteNumber : number, title : String}): Promise<string> {
      const soundTimelineId = uuid.v4();
      const event = makeEvent(context, BakuAction.SOUNDTIMELINE_ADD, {soundTimelineId, params});
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
      return soundTimelineId;
    },

    async removeSoundTimeline(context: any, soundTimelineId: string) {
      const event = makeEvent(context, BakuAction.SOUNDTIMELINE_REMOVE, {soundTimelineId});
      loadEvents(context, [event]);
      await store.dispatch('user/updateCurrentSeenProject');
    },

    async updateSoundTimelineStart(context: any, params : {soundTimelineId : string, start : number, end : number}) {
      const event = makeEvent(context, BakuAction.SOUNDTIMELINE_UPDATE_START, params);
      loadEvents(context, [event]);
    },
  },
  getters: {
    movie: (state): Movie =>
      MovieService.merge(state.id, state.history),

    getMovieFps: (state: any, getters: ProjectGetters): number | undefined => getters.movie.fps,

    getActiveShot: (state, getters: ProjectGetters): Shot | undefined =>
      getters.movie.shots.find((shot: Shot) => shot.id === state.activeShotId),

    getActiveShotIndex: (state, getters: ProjectGetters): number =>
      getters.movie.shots.findIndex((shot: Shot) => shot.id === state.activeShotId),

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
      const index = (getters.getActiveShotIndex - 1) % getters.movie.shots.length;
      if (index === -1) {
        return undefined;
      }
      return getters.movie.shots[index].id;
    },

    getPreviousShot: (state, getters: ProjectGetters): Shot | undefined =>
      getters.movie.shots.find((shot: Shot) => shot.id === getters.getPreviousShotId),

    getNextShotId: (state, getters: ProjectGetters): string | undefined => {
      const index = (getters.getActiveShotIndex + 1) % getters.movie.shots.length;
      return getters.movie.shots[index].id;
    },

    getFirstShot: (state, getters: ProjectGetters): Shot | undefined => {
      return getters.movie.shots[0];
    },

    getFirstShotId: (state, getters: ProjectGetters): string | undefined => {
      return getters.movie.shots[0].id;
    },

    getAllShots:(state, getters: ProjectGetters): Shot[] | undefined => {
      return getters.movie.shots;
    },

    getShotCount: (state, getters: ProjectGetters): number | undefined => {
      return getters.movie.shots.length;
    },

    getImageCount: (state, getters: ProjectGetters): number => {
      return MovieService.getTotalImages(getters.movie);
    },

    getHours: (state, getters: { movie: { shots: { images: string | any[]; }[]; fps: number; }; getImageCount: number; }): any =>
      (shotIndex: number | undefined): any => {
        let imgNb: number
        if (shotIndex != undefined) {
          imgNb = getters.movie.shots[shotIndex].images.length
        } else {
          imgNb = getters.getImageCount
        }
        return computeHours(imgNb, getters.movie.fps)
      },

    getMinutes: (state, getters: { movie: { shots: { images: string | any[]; }[]; fps: number; }; getImageCount: number; }): any =>
      (shotIndex: number | undefined): any => {
        let imgNb: number
        if (shotIndex != undefined) {
          imgNb = getters.movie.shots[shotIndex].images.length
        } else {
          imgNb = getters.getImageCount
        }
        return computeMinutes(imgNb, getters.movie.fps)
      },

    getSeconds: (state, getters: { movie: { shots: { images: string | any[]; }[]; fps: number; }; getImageCount: number; }): any =>
      (shotIndex: number | undefined): any => {
        let imgNb: number
        if (shotIndex != undefined) {
          imgNb = getters.movie.shots[shotIndex].images.length
        } else {
          imgNb = getters.getImageCount
        }
        return computeSeconds(imgNb, getters.movie.fps)
      },

    movieDuration: (state, getters: { getHours: () => any; getMinutes: () => any; getSeconds: () => any; }): Duration => {
      return {
        hours: getters.getHours(),
        minutes: getters.getMinutes(),
        seconds: getters.getSeconds(),
      }
    },
    getAudioRecord: (state, getters: ProjectGetters): Audio[] | undefined =>
      getters.movie.audios,

    getSoundTimeline: (state, getters: ProjectGetters): SoundTimeline[] | undefined =>
      getters.movie.soundsTimeline,
  },
  modules: {},
};export default ProjectStore;

