interface CaptureState {
  stream: MediaStream | null;
  activeCapture: boolean;
}

export const captureStore = {
  namespaced: true,
  state: {
    stream: null,
    activeCapture: false,
  },
  mutations: {
    attachMediaStream(state: CaptureState, stream: MediaStream) {
      state.stream = stream;
    },
    detachMediaStream(state: CaptureState) {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      state.stream = null;
    },
    setActiveCapture(state: CaptureState, activeCapture: boolean) {
      state.activeCapture = activeCapture;
    },
  },
  actions: {
    setActiveCapture(context: { commit: any, state: CaptureState }, activeCapture: boolean) {
      context.commit('setActiveCapture', activeCapture);
      if (activeCapture === false) {
        context.commit('detachMediaStream');
      }
    },
  },
  getters: {
  },
  modules: {},
};
