import { Device } from '@/utils/device.class';
import { BakuModule, CaptureState } from '@/store/store.types';

export const CaptureStore: BakuModule<CaptureState> = {
  namespaced: true,
  state: {
    stream: null,
    activeDevice: null,
    scaleX: 1,
    scaleY: 1,
    onionSkin: 0,
  },
  mutations: {
    attachMediaStream(state, stream: MediaStream) {
      state.stream = stream;
    },
    detachMediaStream(state) {
      if (state.stream && !state.activeDevice?.isSmartphone()) {
        state.stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      state.stream = null;
    },
    setDevice(state, device: Device | null) {
      state.activeDevice = device;
    },
    toggleScaleX(state) {
      state.scaleX *= -1;
    },
    toggleScaleY(state) {
      state.scaleY *= -1;
    },
    setOnionSkin(state, val: number) {
      state.onionSkin = val;
    },
    reset(state) {
      state.stream = null;
      state.activeDevice = null;
      state.scaleX = 1;
      state.scaleY = 1;
      state.onionSkin = 0;
    },
  },
  actions: {
    resetState(context) {
      context.commit('detachMediaStream');
      context.commit('reset');
    },
    selectDevice(context, device: Device | null) {
      context.commit('setDevice', device);
    },

    toggleScaleX(context) {
      context.commit('toggleScaleX');
    },

    toggleScaleY(context) {
      context.commit('toggleScaleY');
    },

    setOnionSkin(context, val: number) {
      context.commit('setOnionSkin', val);
    },
  },
  getters: {
  },
  modules: {},
};
