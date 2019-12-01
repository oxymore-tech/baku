import { Device } from '@/api/device.class';

interface CaptureState {
  stream: MediaStream | null;
  activeDevice: Device | null,
  activeCapture: boolean;
}

export const captureStore = {
  namespaced: true,
  state: {
    stream: null,
    activeDevice: null,
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
    setDevice(state: CaptureState, device: Device | null) {
      state.activeDevice = device;
    },
  },
  actions: {
    selectDevice(context: { commit: any, state: CaptureState }, device: Device | null) {
      context.commit('setDevice', device);
    },

    setActiveCapture(context: { commit: any, state: CaptureState }, activeCapture: boolean) {
      context.commit('setActiveCapture', activeCapture);
      if (!activeCapture) {
        context.commit('detachMediaStream');
      }
    },
  },
  getters: {
  },
  modules: {},
};
