import {Film, FilmService, ImageRef} from "@/api/film-service";

interface ProjectState {
  pictures: string[];
  fullResPicturesCache: HTMLImageElement[];
  film: Film
  id: string;
  activeFrame: number;
}

export const ProjectStore = {
  namespaced: true,
  state: {
    pictures: [],
    fullResPicturesCache: [],
    film: null,
    id: null,
    activeFrame: 0,
  },
  mutations: {
    setFilm(state: ProjectState, payload: { projectId: string, film: Film }) {
      state.id = payload.projectId;
      state.film = payload.film;
      state.activeFrame = 0;
      console.log("film s", state);
    },
    changePlan(state: ProjectState, planId: string) {
      state.activePlan = planId;
      state.pictures = [];
    },
    goToNextFrame(state: ProjectState) {
      if (state.activeFrame === state.pictures.length - 1) {
        state.activeFrame = 0;
      } else {
        state.activeFrame++;
      }
    },
  },
  actions: {
    async loadProject(context: any, projectId: string) {
      const filmService = new FilmService();
      const film = await filmService.get(projectId);
      console.log("film", film);
      await context.commit("setFilm", {projectId, film});
    },
    addImageToPlan(state: ProjectState, payload: { planId: string, imageIndex: number, image: ImageRef }) {
      // TODO 
      /*state.pictures = [...state.pictures, pictureId];
      const fullResImage = new Image();
      fullResImage.src = `/default/images/${state.activePlan}/${pictureId}?width=1280&height=720`;
      state.fullResPicturesCache.push(fullResImage);*/
    },
    goToNextFrameAction(context: any) {
      context.commit("goToNextFrame");
    },
    addNewPictureAction(context: any, pictureId: string) {
      context.commit("addNewPicture", pictureId);
    },
  },
  getters: {
    getPictures: (state: ProjectState) => state.pictures,
    getActiveFrame: (state: ProjectState) => state.pictures.length ? state.pictures[state.activeFrame] : "",
  },
  modules: {},
};
