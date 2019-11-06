export interface PlanState {
    pictures: string[],
    plans: string[],
    activePlan: string
}

export const planStore = {
  namespaced: true,
  state: {
    pictures: [],
    plans: ['totoproject', 'plan2'],
    activePlan: 'totoproject'
  },
  mutations: {
    addNewPicture(state: PlanState, pictureId: string){
        state.pictures = [...state.pictures, pictureId]
    },
    changePlan(state: PlanState, planId: string) {
        state.activePlan = planId;
        state.pictures = [];
    }
  },
  actions: {
  },
  getters: {
      getPictures: (state: any) => state.pictures
  },
  modules: {}
};
