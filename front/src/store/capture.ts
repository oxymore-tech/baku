import { Device } from '@/api/device.class';

interface CaptureState {
  stream: MediaStream | null;
  activeDevice: Device | null,
  activeCapture: boolean;
  scaleX: number;
  scaleY: number;
}

export const captureStore = {
  namespaced: true,
  state: {
    stream: null,
    activeDevice: null,
    activeCapture: false,
    scaleX: 1,
    scaleY: 1,
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
    toggleScaleX(state: CaptureState) {
      state.scaleX *= -1;
    },
    toggleScaleY(state: CaptureState) {
      state.scaleY *= -1;
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

    toggleScaleX(context: { commit: any, state: CaptureState }) {
      context.commit('toggleScaleX');
    },

    toggleScaleY(context: { commit: any, state: CaptureState }) {
      context.commit('toggleScaleY');
    },
  },
  getters: {
  },
  modules: {},
};
