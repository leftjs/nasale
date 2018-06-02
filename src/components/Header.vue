<template>
  <div>
    <div class="header-container">
      <div class="logo-container">
        <img class="logo" :src="logo" alt="">
        <el-menu :default-active="currentMenu" class="menu" mode="horizontal" :router="true">
          <el-menu-item index="/">
            全部项目
          </el-menu-item>
          <el-menu-item index="/issue">
            发布项目
          </el-menu-item>
          <el-menu-item index="/wallet">
            查看资产
          </el-menu-item>
          <el-menu-item index="/me">
            关于作者
          </el-menu-item>
        </el-menu>
      </div>
      <div>
        <span class="account" v-if="currentAccount">当前账户: {{currentAccount}}</span>
        <span class="account" v-else>请先下载
          <a href="https://github.com/ChengOrangeJu/WebExtensionWallet" target="__blank">星云链chrome钱包插件</a>并导入账号
        </span>
      </div>
    </div>
  </div>

</template>


<script>
import NebPay from "nebpay.js";
export default {
  data() {
    return {
      logo: require("@/assets/logo.png"),
      currentMenu: "/"
    };
  },
  computed: {
    currentAccount() {
      return this.$store.state.account;
    }
  },

  created() {
    this.currentMenu = this.$route.path;

    window.postMessage(
      {
        target: "contentscript",
        data: {},
        method: "getAccount"
      },
      "*"
    );
    window.addEventListener("message", e => {
      if (!!e.data) {
        if (!!e.data.data) {
          if (!!e.data.data.account) {
            console.log(e.data.data.account);
            this.$store.commit("setAccount", e.data.data.account);
          }
        }
      }
    });
  },

  methods: {}
};
</script>

<style scoped>
.header-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  /* margin-left: 100px; */
  /* margin-right: 100px; */
  width: 80%;
  margin: 0 auto;
}
.logo-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.logo {
  height: 50px;
}
.menu {
  margin-left: 30px;
}
.account {
  font-size: 0.9rem;
  font-weight: 300;
}
</style>
