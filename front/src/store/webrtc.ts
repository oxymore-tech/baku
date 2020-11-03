import { BakuModule, WebrtcState } from './store.types';

export const WebrtcStore: BakuModule<WebrtcState> = {
  namespaced: true,
  state: {
    peerConnection: undefined as undefined | RTCPeerConnection,
    dataChannel: null as null | RTCDataChannel,
    stream: undefined as undefined | MediaStream,
    isConnected: false,
  },
  mutations: {
    setupConnection(state) {
      console.log('SETUP CONNECTION');
      state.isConnected = true;
    },
    setPeerConnection(state, peerConnection: RTCPeerConnection) {
      console.log('setPeerConnection', peerConnection);
      state.peerConnection = peerConnection;
    },
    setDataChannel(state, dataChannel: RTCDataChannel) {
      console.log('setDataChannel', dataChannel);
      state.dataChannel = dataChannel;
    },
    setMediaStream(state, stream: MediaStream) {
      console.log('setMediaStream', stream);
      state.stream = stream;
    },
    reset(state) {
      state.peerConnection = undefined as undefined | RTCPeerConnection;
      state.dataChannel = null as null | RTCDataChannel;
      state.stream = undefined as undefined | MediaStream;
      state.isConnected = false;
    },
  },
  actions: {
    resetState(context) {
      context.commit('reset');
    },
  },
  getters: {},
  modules: {},
};
