import { Device } from '@/api/device.class';
import { BakuModule, CaptureState } from '@/store/store.types';

export const CaptureStore: BakuModule<CaptureState> = {
  namespaced: true,
  state: {
    stream: null,
    activeDevice: null,
    activeCapture: false,
    scaleX: 1,
    scaleY: 1,
    onionSkin: false,
    onionSkinValue: 3,
  },
  mutations: {
    attachMediaStream(state, stream: MediaStream) {
      state.stream = stream;
    },
    detachMediaStream(state) {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      state.stream = null;
    },
    setActiveCapture(state, activeCapture: boolean) {
      state.activeCapture = activeCapture;
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
    toggleOnionSkin(state) {
      state.onionSkin = !state.onionSkin;
    },
    setOnionSkinValue(state, val: number){
      state.onionSkinValue = val;
    }
  },
  actions: {
    selectDevice(context, device: Device | null) {
      context.commit('setDevice', device);
    },

    setActiveCapture(context, activeCapture: boolean) {
      context.commit('setActiveCapture', activeCapture);
      if (!activeCapture) {
        context.commit('detachMediaStream');
      }
    },

    toggleScaleX(context) {
      context.commit('toggleScaleX');
    },

    toggleScaleY(context) {
      context.commit('toggleScaleY');
    },

    toggleOnionSkin(context) {
      context.commit('toggleOnionSkin');
    },

    setOnionSkinValue(context, val: number) {
      context.commit('setOnionSkinValue', val);
    }
  },
  getters: {
  },
  modules: {},
};
