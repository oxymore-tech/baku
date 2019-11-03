
import Vue from "vue";
import Buefy from "buefy";
import VueQrcodeReader from "vue-qrcode-reader";
import VueQrcode from '@chenfengyuan/vue-qrcode';
import "buefy/dist/buefy.css";
import App from "./App.vue";
import router from "./router";


import store from "./store";

Vue.config.productionTip = false;

Vue.use(Buefy);
Vue.use(VueQrcodeReader);
Vue.use(VueQrcode);

Vue.component(VueQrcode.name, VueQrcode);

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");
