import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';

import ProjectStore from '@/store/project';
import { CaptureStore } from '@/store/capture';
import { WebrtcStore } from '@/store/webrtc';
import { UserStore } from '@/store/user';
import { ClipboardStore } from '@/store/clipboard';
import { BakuRootState } from './store.types';
import { SocketStore } from '@/store/socket';
import { ConnectionLightStore} from '@/store/connectionlight';

Vue.use(Vuex);

const bakuStore: StoreOptions<BakuRootState> = {
  mutations: {},
  actions: {},
  modules: {
    webrtc: WebrtcStore,
    project: ProjectStore,
    capture: CaptureStore,
    user: UserStore,
    clipboard: ClipboardStore,
    socket: SocketStore,
    connection: ConnectionLightStore
  },
  strict: process.env.NODE_ENV !== 'production',
  getters : {}, 
};

export default new Vuex.Store(bakuStore);
