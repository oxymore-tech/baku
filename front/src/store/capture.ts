import { Device } from '@/utils/device.class';
import { BakuModule, CaptureState } from '@/store/store.types';

const defaultState = {
    stream: null,
    activeDevice: null,
    scaleX: 1,
    scaleY: 1,
    onionSkinDisplay: false,
    onionSkinValue: 1,
  }

export const CaptureStore: BakuModule<CaptureState> = {
  namespaced: true,
  state: defaultState,
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
    setOnionSkinDisplay(state, val: boolean) {
      state.onionSkinDisplay = val;
    },
    setOnionSkinValue(state, val: number) {
      state.onionSkinValue = val;
    },
    reset(state) {
      state = defaultState;
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

    setOnionSkinDisplay(context, val: boolean) {
      context.commit('setOnionSkinDisplay', val);
    },
    setOnionSkinValue(context, val: number) {
      context.commit('setOnionSkinValue', val);
    },
  },
  getters: {
  },
  modules: {},
};
