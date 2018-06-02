import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import Issue from "./views/Issue.vue";
import Wallet from "./views/Wallet.vue";
import Me from "./views/Me.vue";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/issue",
      name: "issue",
      component: Issue
    },
    {
      path: "/wallet",
      name: "wallet",
      component: Wallet
    },
    {
      path: "/me",
      name: "me",
      component: Me
    }
  ]
});
