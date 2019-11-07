export interface PlanState {
  pictures: string[],
  fullResPicturesCache: HTMLImageElement[]
  plans: string[],
  activePlan: string,
  activeFrame: number
}

export const planStore = {
  namespaced: true,
  state: {
    pictures: [],
    fullResPicturesCache: [],
    plans: ['plan1', 'plan2'],
    activePlan: 'plan1',
    activeFrame: 0
  },
  mutations: {
    addNewPicture(state: PlanState, pictureId: string) {
      state.pictures = [...state.pictures, pictureId];
      const fullResImage = new Image();
      fullResImage.src = `/default/images/${state.activePlan}/${pictureId}?width=1280&height=720`;
      state.fullResPicturesCache.push(fullResImage);
    },
    changePlan(state: PlanState, planId: string) {
      state.activePlan = planId;
      state.pictures = [];
    },
    goToNextFrame(state: PlanState) {
      if (state.activeFrame === state.pictures.length - 1) {
        state.activeFrame = 0;
      } else {
        state.activeFrame++;
      }
    }
  },
  actions: {
    goToNextFrameAction(context: any) {
      context.commit('goToNextFrame');
    },
    addNewPictureAction(context: any, pictureId: string) {
      context.commit('addNewPicture', pictureId);
    }
  },
  getters: {
    getPictures: (state: PlanState) => state.pictures,
    getActiveFrame: (state: PlanState) => state.pictures.length ? state.pictures[state.activeFrame] : ''
  },
  modules: {}
};
