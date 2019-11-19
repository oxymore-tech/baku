import Vue from "vue";
import Vuex from "vuex";
import { planStore } from "./plan";
import { captureStore } from "./capture";

Vue.use(Vuex);

export type SocketStatus = "opened" | "closed" | "error";

export default new Vuex.Store({
  state: {
    peerConnection: undefined as undefined | RTCPeerConnection,
    dataChannel: null as null | RTCDataChannel,
    stream: undefined as undefined | MediaStream,
    isConnected: false,
    socketStatus: "closed" as SocketStatus,
  },
  mutations: {
    setupConnection(state) {
      console.log("SETUP CONNECTION");
      state.isConnected = true;
    },
    setPeerConnection(state, peerConnection: RTCPeerConnection) {
      console.log("setPeerConnection", peerConnection);
      state.peerConnection = peerConnection;
    },
    setDataChannel(state, dataChannel: RTCDataChannel) {
      console.log("setDataChannel", dataChannel);
      state.dataChannel = dataChannel;
    },
    setMediaStream(state, stream: MediaStream) {
      console.log("setMediaStream", stream);
      state.stream = stream;
  },
    setSocketStatus(state, status: SocketStatus) {
      console.log("setSocketStatus", status);
      state.socketStatus = status;
    },
  },
  actions: {
  },
  modules: {
    plan: planStore,
    capture: captureStore,
  },
});
