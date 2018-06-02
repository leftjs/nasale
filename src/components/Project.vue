<template>
  <el-card shadow="hover">
    <img :src="token.logo" class="logo" alt="">
    <div class="content">
      <span class="title">{{token.name}}</span>
      <p class="summary">{{token.desc}}</p>
      <p class="time">{{token.openingTime}} ~ {{token.endingTime}}</p>
      <div class="info">
        <p>发行总量: {{token.totalSupply}}万 {{token.symbol}}</p>
        <p>众筹数量: {{token.cap}}万 {{token.symbol}}</p>
        <p>众筹单价: {{token.rate}}NAS/{{token.symbol}}</p>
      </div>
    </div>
    <div style="text-align:right">
      <el-button size="mini" type="danger" @click="emitBuy" :disabled="checkInvaild">{{checkInvaild ? "已过期" : "购买"}}</el-button>
    </div>
  </el-card>
</template>


<script>
import moment from "moment";
export default {
  data() {
    return {};
  },
  props: ["token"],
  methods: {
    emitBuy() {
      this.$emit("buy", this.token);
    }
  },
  computed: {
    checkInvaild() {
      const openingTime = moment(this.token.openingTime, "YYYY年M月D日");
      const endingTime = moment(this.token.endingTime, "YYYY年M月D日");
      const now = moment();
      if (openingTime.isAfter(now) || endingTime.isBefore(now)) return true;
      else return false;
    }
  }
};
</script>


<style lang="scss" scoped>
.logo {
  width: 150px;
  height: 150px;
  object-fit: contain;
  border-radius: 75px;
}
.content {
  margin-top: 20px;
}
.info {
  text-align: center;
  font-size: 0.5rem;
  font-weight: 300;
  border-top: 1px solid lightgrey;
}
.title {
  font-size: 1rem;
  font-weight: 900;
}
.summary {
  font-size: 0.8rem;
  font-weight: 400;
  // text-align: left;
  overflow: hidden;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.time {
  font-size: 0.7rem;
  font-weight: 500;
}
</style>
