import { BakuModule, SocketState, SocketStatus } from './store.types';
import { WSSocket, WSMessage } from '@/utils/socket.class';



export const SocketStore: BakuModule<SocketState> = {
  namespaced: true,
  state: {
    socket: new WSSocket(),
    socketStatus: 'closed' as SocketStatus,
    socketId: undefined as unknown as string
  },
  mutations: {
    setSocketStatus(state: SocketState, status: SocketStatus) {
      console.log('setSocketStatus', status);
      state.socketStatus = status;
    },
    addEventListener(state: SocketState, value:  { message: string, callback: EventListenerOrEventListenerObject }) {
      state.socket.addEventListener(value.message, value.callback);
    },
    sendMessage(state: SocketState, message: WSMessage) {
      state.socket.sendWSMessage(message);
    },
    setSocketId(state: SocketState, socketId: string) {
      state.socketId = socketId;
    },
  },
  actions: {
    setSocketStatus(context: any, status: SocketStatus){
      context.commit('setSocketStatus', status);
    },
    addEventListener(context: any, value: { message: string, callback: EventListenerOrEventListenerObject }) {
      context.commit('addEventListener', value)
    },
    sendMessage(context: any, message: WSMessage) {
      context.commit('sendMessage', message)
    },
    setSocketId(context: any, socketId: string) {
      context.commit('setSocketId', socketId)
    }
  },
  getters: {},
  modules: {},
};
