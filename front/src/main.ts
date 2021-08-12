import Vue from 'vue';
import Buefy from 'buefy';
import VueQrcodeReader from 'vue-qrcode-reader';
import VueQrcode from '@chenfengyuan/vue-qrcode';
// import 'buefy/dist/buefy.css';
import VueAnalytics from 'vue-analytics';
import { ImageCacheService } from './utils/imageCache.service';
import App from './App.vue';
import router from './router';
import store from './store';


Vue.config.productionTip = false;

Vue.use(VueAnalytics, {
  id: 'UA-710041-23',
  router,
});

Vue.use(Buefy);
Vue.use(VueQrcodeReader);
Vue.use(VueQrcode);

Vue.component(VueQrcode.name, VueQrcode);

Vue.mixin({
  data() {
    return {
      get ImageCacheService() {
        return ImageCacheService;
      },
    };
  },
});

new Vue({
  router,
  render: (h) => h(App),
  store,
  created () {
    window.addEventListener('offline', () => {
      store.dispatch('setConnected', false),
      store.dispatch('setOffline', true),
      store.dispatch('setSynced', true)
    })
    window.addEventListener('online', () => {
      store.dispatch('setConnected', false),
      store.dispatch('setOffline', false),
      store.dispatch('setSynced',false)
    })
    window.addEventListener('synced', () =>{
      store.dispatch('setSynced',true),
      store.dispatch('setConnected',true),
      store.dispatch('setOffline',false)
    })
  }
}).$mount('#app');
