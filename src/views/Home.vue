<template>
  <div class="home">

    <Project class="token" :token="token" v-for="token in tokens" :key="token.id" @buy="buy" />
    <el-dialog :title="currentBuyToken.title" :visible.sync="dialogVisible" width="50%" name="test">
      <img :src="currentBuyToken.logo" alt="">
      <p>{{currentBuyToken.name}} / {{currentBuyToken.symbol}}</p>
      <p>项目简介: {{currentBuyToken.desc}}</p>
      <p>项目官网:
        <a :href="currentBuyToken.url" target="__blank">{{currentBuyToken.url}}</a>
      </p>
      <p>众筹时间: {{currentBuyToken.openingTime}} ~ {{currentBuyToken.endingTime}}</p>
      <p>发行总量: {{currentBuyToken.totalSupply}}万 {{currentBuyToken.symbol}}</p>
      <p>众筹总量: {{currentBuyToken.cap}}万 {{currentBuyToken.symbol}}</p>
      <p>已筹数量: {{currentBuyToken.tokenRasised}}万 {{currentBuyToken.symbol}}</p>
      <p class="line"></p>
      <p>
        <el-form :model="buyInfo" label-width="100px" :rules="buyRules">
          <el-form-item label="购买数量" prop="amount">
            <el-input v-model.number="buyInfo.amount" type="number" auto-complete="off" placeholder="eg: 1">
              <template slot="append">{{currentBuyToken.symbol}}</template>
            </el-input>
          </el-form-item>
          <el-form-item label="收款地址" prop="address">
            <el-input v-model="buyInfo.address" placeholder="eg: n1TPjVhcMgoZ5h625GC6ba53WF2VZznsUbZ"></el-input>
          </el-form-item>

        </el-form>
      </p>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="buySubmit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listTokens, buyToken } from "@/firebase";
import Project from "@/components/Project";
import BigNumber from "bignumber.js";
import moment from "moment";
import "dayjs/locale/zh-cn";
import NebPay from "@/nebpay";
import _ from "lodash";

export default {
  name: "home",
  components: {
    Project
  },
  data() {
    return {
      nebpay: new NebPay(),
      buyInfo: {
        amount: "",
        address: ""
      },
      buyRules: {
        amount: [
          {
            required: true,
            message: "请输入购买数量",
            trigger: "blur"
          }
        ],
        address: [
          {
            required: true,
            message: "请输入收款地址",
            trigger: "blur"
          }
        ]
      },
      preTokens: [],
      dialogVisible: false,
      currentBuyToken: {}
    };
  },
  computed: {
    tokens() {
      let map = this.preTokens.map(token => {
        let {
          id,
          name,
          symbol,
          decimals,
          totalSupply,
          rate,
          cap,
          url,
          desc,
          logo,
          openingTime,
          endingTime,
          contractAddress
        } = token;

        decimals = new BigNumber(decimals);
        totalSupply = new BigNumber(totalSupply) / 10000;
        cap = new BigNumber(cap);
        rate = new BigNumber(Math.pow(10, decimals) / Math.pow(10, 18) / new BigNumber(rate)).toString(10);
        cap = new BigNumber(cap / Math.pow(10, decimals) / 10000).toString(10);
        openingTime = moment(token.openingTime * 1000).format("YYYY年M月D日");
        endingTime = moment(token.endingTime * 1000).format("YYYY年M月D日");

        return {
          id,
          name,
          symbol,
          totalSupply,
          cap,
          rate,
          logo,
          desc,
          url,
          openingTime,
          endingTime,
          contractAddress
        };
      });
      map = _.reverse(map);

      return map;
    }
  },

  // "{"name":"thehta","symbol":"ETH","decimals":"18","totalSupply":"210000000000000000000000000","rate":"1","openingTime":"1528819200","endingTime":"1531929600","cap":"2100000000000000000000","weiRasised":"0","owner":"n1TPjVhcMgoZ5h625GC6ba53WF2VZznsUbZ","currentTime":1527869393}"
  methods: {
    buySubmit() {
      // this.nebpay
      //   .call(
      //     this.currentBuyToken.contractAddress,
      //     new BigNumber(this.buyInfo.amount * this.currentBuyToken.rate * Math.pow(10, 18)),
      //     "buyTokens",
      //     JSON.stringify([this.buyInfo.address])
      //   )
      //   .then(res => {
      //     this.$message.success("购买成功");
      //   })
      //   .catch(err => {
      //     this.$message.error(`购买失败${err.message || err.toString()}`);
      //   });

      this.nebpay
        .simulateCall(
          this.currentBuyToken.contractAddress,
          new BigNumber(this.buyInfo.amount * this.currentBuyToken.rate).toString(),
          "buyTokens",
          JSON.stringify([this.buyInfo.address])
        )
        .then(res => {
          if (res.execute_err === "") {
            // 可以购买
            this.nebpay
              .call(
                this.currentBuyToken.contractAddress,
                new BigNumber(this.buyInfo.amount * this.currentBuyToken.rate).toString(),
                "buyTokens",
                JSON.stringify([this.buyInfo.address])
              )
              .then(r => {
                const loading = this.$loading({
                  lock: true,
                  text: "正在购买代币，请稍候...",
                  spinner: "el-icon-loading",
                  background: "rgba(0, 0, 0, 0.7)"
                });
                // r  = {txhash: "958a7beccd1e28d793bc6d2ced0449d4f82f995af53e1ba9d6b74e9de8ddc0ca", contract_address: ""}
                this.$message("正在获取支付结果，请不要关闭页面...");
                NebPay.checkState(
                  r,
                  result => {
                    this.$message.success("购买成功");
                    buyToken(this.buyInfo.address, this.currentBuyToken.contractAddress);
                    loading.close();
                    this.dialogVisible = false;
                    this.buyInfo = {
                      account: "",
                      address: ""
                    };
                  },
                  errResult => {
                    this.$message.error("购买失败");
                    loading.close();
                    console.log(errResult);
                  }
                );
                // if (r.execute_err === "") {
                //   // 购买成功

                //   this.$message.success("购买成功");
                //   buyToken(this.buyInfo.address, this.currentBuyToken.contractAddress);
                // }
              });
          } else {
            let message = "";
            if (res.result === "Error: too large weiAmount") {
              message = "剩余众筹总量不足，请修改购买数量";
            } else if (res.result === "Error: invalid wallet address.") {
              message = "收款地址不正确，请修改收款地址";
            }
            this.$message.error(message);
          }
        });
    },
    buy(token) {
      const nebpay = new NebPay();
      nebpay
        .simulateCall(token.contractAddress, 0, "info", JSON.stringify([]))
        .then(res => {
          // const tokenInfo = JSON.parse(
          //   '{"name":"thehta","symbol":"ETH","decimals":"18","totalSupply":"210000000000000000000000000","rate":"1","openingTime":"1528819200","endingTime":"1531929600","cap":"2100000000000000000000","weiRasised":"0","owner":"n1TPjVhcMgoZ5h625GC6ba53WF2VZznsUbZ","currentTime":1527869393}'
          // );
          const tokenInfo = JSON.parse(res.result);
          const { name } = token;

          let { weiRasised } = tokenInfo;
          const tokenRasised = new BigNumber(weiRasised / Math.pow(10, 18) / token.rate / 1000).toString(10);
          this.currentBuyToken = {
            ...token,
            tokenRasised,
            title: `购买 - ${name}`
          };

          this.dialogVisible = true;
        })
        .catch(err => {
          console.error(err);
          this.$message.error("NAS网络拥堵...");
        });
    }
  },
  created() {
    listTokens(token => {
      this.preTokens.push({ id: token.key, ...token.val() });
    });
  }
};
</script>


<style lang="scss" scoped>
.line {
  border-top: 1px solid lightgrey;
  margin: 20px 15%;
}
</style>


<style lang="scss" >
.home {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 80%;
  margin: 0 auto;
  &:after {
    content: "";
    flex: auto;
    width: 300px;
  }
  .token {
    margin: 20px;
    width: 300px;
    // margin-top: 20px;
  }
}
</style>


