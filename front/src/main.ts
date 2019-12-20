import Vue from 'vue';
import Buefy from 'buefy';
import VueQrcodeReader from 'vue-qrcode-reader';
import VueQrcode from '@chenfengyuan/vue-qrcode';
import 'buefy/dist/buefy.css';
import App from './App.vue';
import router from './router';
import store from './store';
import {ImageCacheService} from "@/api/imageCache.service";

Vue.config.productionTip = false;

Vue.use(Buefy);
Vue.use(VueQrcodeReader);
Vue.use(VueQrcode);

Vue.component(VueQrcode.name, VueQrcode);

Vue.mixin({
  data: function () {
    return {
      get ImageCacheService() {
        return ImageCacheService;
      }
    }
  }
});

new Vue({
  router,
  render: (h) => h(App),
  store,
}).$mount('#app');
