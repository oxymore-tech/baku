interface ProjectState {
  pictures: string[];
  fullResPicturesCache: HTMLImageElement[];
  plans: string[];
  id: string;
  activePlan: string;
  activeFrame: number;
}

export const ProjectStore = {
  namespaced: true,
  state: {
    pictures: [],
    fullResPicturesCache: [],
    plans: ["plan1", "plan2"],
    id: "to_set",
    activePlan: "plan1",
    activeFrame: 0,
  },
  mutations: {
    addNewPicture(state: ProjectState, pictureId: string) {
      state.pictures = [...state.pictures, pictureId];
      const fullResImage = new Image();
      fullResImage.src = `/default/images/${state.activePlan}/${pictureId}?width=1280&height=720`;
      state.fullResPicturesCache.push(fullResImage);
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
