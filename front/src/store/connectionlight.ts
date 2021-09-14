
import { BakuModule, ConnectionState } from '@/store/store.types';

export const ConnectionLightStore : BakuModule<ConnectionState> = ({
  state: {
    connected: navigator.onLine,
    synced : true,//window.indexedDB.open("PostDB").result.transaction('postrequest', 'readwrite').objectStore('postrequest').getAll.length ==0,
    offline : !navigator.onLine, 
  },
  getters: {
    connected: state => state.connected, //&& state.synced,
    offline: state => state.offline,
    synced: state => state.synced
  },
  mutations: {
    'SET_CONNECTED' (state, payload) {
      state.connected = payload
    },
    'SET_OFFLINE'(state,payload) {
      state.offline = payload
    },
    'SET_SYNCED'(state,payload) {
      state.synced = payload
    },
  },
  actions: {
    setConnected ({ commit }, payload) {
      commit('SET_CONNECTED', payload)
    },
    setOffline ({ commit }, payload) {
      commit('SET_OFFLINE', payload)
    },
    setSynced ({ commit }, payload) {
      commit('SET_SYNCED', payload)
    }
  }
})
