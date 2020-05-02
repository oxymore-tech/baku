import Vue from 'vue';
import Buefy from 'buefy';
import VueQrcodeReader from 'vue-qrcode-reader';
import VueQrcode from '@chenfengyuan/vue-qrcode';
// import 'buefy/dist/buefy.css';
import { ImageCacheService } from './utils/imageCache.service';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

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
}).$mount('#app');
