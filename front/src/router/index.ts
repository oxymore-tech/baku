import Vue from "vue";
import VueRouter from "vue-router";
import Init from "../views/Init.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Init",
    component: Init
  },
  {
    path: "/home",
    name: "home",
    component: () =>
      import("../views/Home.vue")
  },
  {
    path: "/capture",
    name: "capture",
    component: () =>
      import("../views/Capture.vue")
  },
  {
    path: "/about",
    name: "about",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue")
  },
  {
    path: "/computer",
    name: "computer",
    component: () =>
      import("../views/ComputerView.vue")
  },
  {
    path: "/smartphone",
    name: "smartphone",
    component: () =>
      import("../views/SmartphoneView.vue")
  }
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes
});

export default router;
