import {Movie, MovieService, Shot,} from '@/api/movie.service';
import {BakuEvent} from '@/api/baku.service';

const movieService = new MovieService();

interface ProjectState {
  id: string;
  activeShotId: string;
  history: BakuEvent[];
}

export const ProjectStore = {
  namespaced: true,
  state: {
    id: null,
    activeShotId: undefined,
    history: [],
  },
  mutations: {
    setMovie(state: ProjectState, payload: { projectId: string, movieHistory: BakuEvent[] }) {
      state.id = payload.projectId;
      state.history = payload.movieHistory;
    },
    addToLocalHistory(state: ProjectState, event: BakuEvent) {
      state.history.push(event);
    },
    changeActiveShot(state: ProjectState, shotId: string) {
      state.activeShotId = shotId;
    },
  },
  actions: {
    async loadProject(context: any, projectId: string): Promise<void> {
      // const movie = await movieService.get(projectId);
      const movieHistory = await movieService.getHistory(projectId);
      await context.commit('setMovie', {projectId, movieHistory});
    },
    async addImageToShot(context: any,
                         payload: { shotId: string, imageIndex: number, image: string }): Promise<void> {
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
      const event = await movieService.updateTitle(context.state.id, title, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },

    async updateSynopsis(context: any, synopsis: string) {
      const event = await movieService.updateSynopsis(context.state.id, synopsis, context.rootState.user.username);
      context.commit('addToLocalHistory', event);
    },

    async createShot(context: any, name = 'Default shot'): Promise<string> {
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

    getActiveShot: (state: ProjectState, getters: any): Shot =>
      getters.movie.shots.find((shot: Shot) => shot.id === state.activeShotId)

  },
  modules: {},
};
