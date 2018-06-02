<template>
  <div>
    <el-card class="container" body-style="width: 100%; padding: 0px;">
      <el-input placeholder="请输入要查询的钱包地址" v-model="account">
        <el-button slot="append" icon="el-icon-search" @click="search"></el-button>
      </el-input>
      <div>
        <!-- <p v-for="token in tokens" :key="token.address">{{token.address}}{{token.info.symbol}}{{token.balance}}</p> -->
        <el-table :data="tokens" header-align="center" align="center">
          <el-table-column label="代币名称" prop="info.name" />
          <el-table-column label="代币符号" prop="info.symbol" />
          <el-table-column label="合约地址" prop="address" />
          <el-table-column label="代币数量" prop="balance" />
        </el-table>
      </div>
    </el-card>
  </div>

</template>

<script>
import { listAccounts } from "@/firebase";
import NebPay from "@/nebpay";
import BigNumber from "bignumber.js";
import lodash from "lodash";

export default {
  data() {
    return {
      account: "",

      tokens: [],
      nebpay: new NebPay()
    };
  },
  methods: {
    search() {
      const account = this.account;
      listAccounts(account, res => {
        // 开始加载
        const loading = this.$loading({
          lock: true,
          text: "正在查询，请稍候...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)"
        });
        this.tokens = [];
        // this.contractAddresses = Object.keys(res.val());
        // console.log(this.contractAddresses);
        const contractAddresses = Object.keys(res.val());
        _.each(contractAddresses, async (contractAddress, index) => {
          let info = await this.nebpay.simulateCall(contractAddress, 0, "info", JSON.stringify([this.account]));
          const tokenInfo = JSON.parse(info.result);
          let balance = await this.nebpay.simulateCall(contractAddress, 0, "balanceOf", JSON.stringify([this.account]));
          // console.log(balance.result);
          balance = new BigNumber(JSON.parse(balance.result))
            .dividedBy(Math.pow(10, parseInt(tokenInfo.decimals)))
            .toString(10);
          // console.log(balance);
          this.tokens.push({
            address: contractAddress,
            info: tokenInfo,
            balance
          });

          if (index === contractAddresses.length - 1) {
            loading.close();
          }
        });
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.container {
  width: 80%;
  margin: 0 auto;
  padding: 50px;
}
</style>

