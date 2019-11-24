import Vue from "vue";
import VueRouter from "vue-router";
import Init from "../views/Init.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Init",
    component: Init,
  },
  {
    path: "/home",
    name: "home",
    component: () =>
      import("../views/Home.vue"),
  },
  {
    path: "/capture",
    name: "capture",
    component: () =>
      import("../views/Capture.vue"),
  },
  {
    path: "/smartphone",
    name: "smartphone",
    component: () =>
      import("../views/SmartphoneView.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
