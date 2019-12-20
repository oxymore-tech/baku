export type SocketStatus = 'opened' | 'closed' | 'error';

interface WebrtcState {
  peerConnection: undefined | RTCPeerConnection,
  dataChannel: null | RTCDataChannel,
  stream: undefined | MediaStream,
  isConnected: boolean,
  socketStatus: SocketStatus,
}

export const WebrtcStore = {
  namespaced: true,
  state: {
    peerConnection: undefined as undefined | RTCPeerConnection,
    dataChannel: null as null | RTCDataChannel,
    stream: undefined as undefined | MediaStream,
    isConnected: false,
    socketStatus: 'closed' as SocketStatus,
  },
  mutations: {
    setupConnection(state: WebrtcState) {
      console.log('SETUP CONNECTION');
      state.isConnected = true;
    },
    setPeerConnection(state: WebrtcState, peerConnection: RTCPeerConnection) {
      console.log('setPeerConnection', peerConnection);
      state.peerConnection = peerConnection;
    },
    setDataChannel(state: WebrtcState, dataChannel: RTCDataChannel) {
      console.log('setDataChannel', dataChannel);
      state.dataChannel = dataChannel;
    },
    setMediaStream(state: WebrtcState, stream: MediaStream) {
      console.log('setMediaStream', stream);
      state.stream = stream;
    },
    setSocketStatus(state: WebrtcState, status: SocketStatus) {
      console.log('setSocketStatus', status);
      state.socketStatus = status;
    },
  },
  actions: { },
  getters: { },
  modules: {},
};
