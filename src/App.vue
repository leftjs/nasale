<template>
  <div id="app">
    <Header class="head"></Header>
    <router-view class="rv" />

  </div>
</template>

<script>
import Header from "@/components/Header.vue";

export default {
  components: {
    Header
  }
};
</script>


<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

html,
body,
#app {
  height: 100%;
}

.head {
  z-index: 100;
  position: fixed;
  width: 100%;
  box-shadow: 0 0 5px 0 #cccccc;
  background: white;
}
.rv {
  padding-top: 100px;
}
</style>
