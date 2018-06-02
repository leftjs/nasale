<template>
  <div class="container">
    <el-card style="padding: 50px;" body-style="width: 100%; padding: 0px;">
      <div class="notify">
        <div class="left">
          <el-form ref="token" :model="token" :rules="rules" label-width="120px">
            <el-form-item label="代币名称" prop="name">
              <el-input placeholder="eg: NEBULAS(星云币)" v-model="token.name"></el-input>
            </el-form-item>
            <el-form-item label="代币符号" prop="symbol">
              <el-input placeholder="eg: NAS" v-model="token.symbol"></el-input>
            </el-form-item>
            <el-form-item label="代币位数" prop="decimals">
              <el-input placeholder="eg: 18" type="number" v-model.number="token.decimals"></el-input>
            </el-form-item>
            <el-form-item label="代币总量" prop="totalSupply">
              <el-input placeholder="eg: 30000000" type="number" v-model.number="token.totalSupply">
                <template slot="append">{{token.symbol ? token.symbol : "YOUR TOKEN"}}</template>
              </el-input>
            </el-form-item>
            <el-form-item label="众筹目标" prop="cap">
              <el-input placeholder="eg: 10" type="number" v-model.number="token.cap">
                <template slot="append">{{token.symbol ? token.symbol : "YOUR TOKEN"}}</template>
              </el-input>
            </el-form-item>
            <el-form-item label="众筹价格" prop="rate">
              <el-input placeholder="eg: 1000" type="number" v-model.number="token.rate">
                <template slot="append">NAS/{{token.symbol ? token.symbol : "YOUR TOKEN"}}</template>
              </el-input>
            </el-form-item>
            <el-form-item label="众筹时间" prop="crowdTime" class="crowdTime">
              <el-date-picker v-model="token.crowdTime" type="daterange" value-format="timestamp" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期">
              </el-date-picker>
            </el-form-item>
            <el-form-item label="代币图标" prop="logo">
              <el-upload class="logo-uploader" :data="uploadData" :action="qnLocation" :show-file-list="false" :on-success="handleLogoUploadSuccess" :before-upload="beforeLogoUpload">
                <img v-if="token.logo" :src="token.logo" class="logo">
                <i v-else class="el-icon-plus logo-uploader-icon"></i>
                <el-input v-show="false" v-model="token.logo"></el-input>
              </el-upload>
            </el-form-item>
            <el-form-item label="代币链接" prop="url">
              <el-input placeholder="eg: https://nebulas.io/" v-model="token.url"></el-input>
            </el-form-item>
            <el-form-item label="代币描述" prop="desc">
              <el-input placeholder="eg: 星云链..." type="textarea" v-model="token.desc"></el-input>
            </el-form-item>
            <el-form-item style="text-align: left;">
              <el-button type="success" @click="onSubmit">发布</el-button>
              <el-button type="danger" @click="reset">重填</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="right">
          <p class="title">注意事项</p>
          <p>1.代币信息一旦创建无法修改，请仔细检查</p>
          <p>2.用户购买时必须在有效众筹时间</p>
          <p>3.申请代币的总量全部汇入钱包用户的地址中</p>
          <p>4.代币图标尽可能保持1:1的图片比例</p>
          <p>5.代币描述尽量言简意赅</p>
          <p>6.代币链接请填写项目官网</p>
          <p>7.可在“查看资产”页面检查资产是否到账和代币合约地址</p>
        </div>
      </div>

    </el-card>

  </div>
</template>


<script>
import axios from "axios";
import { postToken, buyToken } from "@/firebase";
import NebPay from "@/nebpay";
import fs from "fs";
import BigNumber from "bignumber.js";
import _ from "lodash";

const PICTURE_DOMAIN = "http://p9fmyu9x6.bkt.clouddn.com/";
const NOW_URL = "https://nasale-micro-ruapdchnql.now.sh";

export default {
  data() {
    return {
      timer: null,
      tokenData: {},
      uploadData: {},
      token: {
        name: "",
        symbol: "",
        decimals: "",
        totalSupply: "",
        rate: "",
        cap: "",
        crowdTime: [],
        desc: "",
        logo: "",
        url: ""
      },
      rules: {
        name: [{ required: true, message: "请输入代币名称", trigger: "blur" }],
        symbol: [
          {
            required: true,
            message: "请输入代币符号",
            trigger: "blur"
          }
        ],
        decimals: [{ required: true, message: "请输入代币位数", trigger: "blur" }],
        totalSupply: [{ required: true, message: "请输入代币总量", trigger: "blur" }],
        rate: [{ required: true, message: "请输入众筹单价", trigger: "blur" }],
        cap: [{ required: true, message: "请输入众筹目标", trigger: "blur" }],
        desc: [{ required: true, message: "请输入代币描述", trigger: "blur" }],
        url: [
          { required: true, message: "请输入代币链接", trigger: "blur" },
          {
            type: "url",
            message: "必须是有效的URL",
            trigger: "blur"
          }
        ],
        crowdTime: [
          {
            required: true,
            message: "请选择众筹起止时间",
            trigger: "blur"
          }
        ],
        logo: [{ required: true, message: "请选择代币图标", trigger: "change" }]
      }
    };
  },
  computed: {
    qnLocation() {
      return location.protocol === "http:" ? "http://upload-z2.qiniup.com" : "https://upload-z2.qiniup.com";
    },
    nebpay() {
      return new NebPay();
    },
    currentAccount() {
      return this.$store.state.account;
    }
  },
  created() {
    window.addEventListener("message", e => {
      if (!!e.data) {
        if (!!e.data.data) {
          if (!!e.data.data.txhash) {
            this.$message("请不要离开此页面，静候交易完成！");
            const loading = this.$loading({
              lock: true,
              text: "正在创建代币，请稍候...",
              spinner: "el-icon-loading",
              background: "rgba(0, 0, 0, 0.7)"
            });
            const txhash = e.data.data.txhash;
            // this.checkState(e.data.data.txhash);
            NebPay.checkState(
              txhash,
              result => {
                if (!_.isEmpty(this.tokenData)) {
                  postToken({
                    ...this.tokenData,
                    txhash: txhash.txhash,
                    contractAddress: txhash.contract_address,
                    owner: this.currentAccount,
                    createdAt: result.timestamp
                  });
                  buyToken(this.$store.state.account, txhash.contract_address);
                  this.$message.success("代币创建成功");
                  this.tokenData = {};
                  loading.close();
                }
              },
              () => {
                this.$message.error("代币创建失败，请检查");
                loading.close();
              }
            );
          }
        }
      }
    });
  },
  methods: {
    // checkState(txhash) {
    //   function sleep(ms) {
    //     return new Promise(resolve => setTimeout(resolve, ms));
    //   }
    //   axios
    //     .post(`${process.env.VUE_APP_NEBULAS_DOMAIN}/v1/user/getTransactionReceipt`, { hash: txhash.txhash })
    //     .then(async res => {
    //       const status = res.data.result.status;
    //       const timestamp = res.data.result.timestamp;
    //       if (status == 1) {
    //         if (!_.isEmpty(this.tokenData)) {
    //           postToken({
    //             ...this.tokenData,
    //             txhash: txhash.txhash,
    //             contractAddress: txhash.contract_address,
    //             owner: this.currentAccount,
    //             createdAt: timestamp
    //           });
    //           this.$message.success("token发布成功");
    //           this.tokenData = {};
    //         }
    //       } else if (status == 0) {
    //         this.$message.error("token发布失败，请检查");
    //       } else {
    //         await sleep(5000);
    //         this.checkState(txhash);
    //       }
    //     })
    //     .catch(async err => {
    //       await sleep(5000);
    //       this.checkState(txhash);
    //     });
    // },

    onSubmit() {
      this.$refs["token"].validate(valid => {
        if (valid) {
          // 获取合约代码
          axios
            .get(`${NOW_URL}/contract`)
            .then(res => {
              const source = res.data;

              let { name, symbol, decimals, totalSupply, rate, cap, crowdTime, url, desc, logo } = this.token;

              const openingTime = parseInt(crowdTime[0]) / 1000 + "";
              const endingTime = parseInt(crowdTime[1]) / 1000 + "";
              rate = new BigNumber(Math.pow(10, decimals) / Math.pow(10, 18) / rate).toString(10);
              cap = new BigNumber(cap * Math.pow(10, decimals)).toString(10);
              symbol = _.toUpper(symbol);
              const args = [name, symbol, decimals, totalSupply, rate, cap, openingTime, endingTime];

              // 待存储到firebase
              this.tokenData = {
                name,
                symbol,
                decimals,
                totalSupply,
                rate,
                cap,
                openingTime,
                endingTime,
                url,
                desc,
                logo
              };
              // 调起钱包合约
              window.postMessage(
                {
                  target: "contentscript",
                  data: {
                    to: this.currentAccount,
                    value: "0",
                    contract: {
                      //"contract" is a parameter used to deploy a contract or call a smart contract function
                      source: source,
                      sourceType: "js",
                      args: JSON.stringify(args)
                    }
                  },
                  method: "neb_sendTransaction"
                },
                "*"
              );
            })
            .catch(err => {
              console.log(err);
            });
          // postToken(this.token);
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    reset() {
      this.token = {
        name: "",
        symbol: "",
        decimals: "",
        totalSupply: "",
        key: "",
        logo: ""
      };
    },
    handleLogoUploadSuccess(e) {
      console.log("upload success");

      // console.log(file);
      this.token.logo = PICTURE_DOMAIN + e.key;
    },
    beforeLogoUpload(file) {
      const suffix = file.name.split(".");
      const ext = suffix.splice(suffix.length - 1, 1)[0];
      const isJPG = file.type.startsWith("image");
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG) {
        this.$message.error("只能上传图片格式");
      }
      if (!isLt2M) {
        this.$message.error("logo图片大小不能超过 2MB!");
      }
      return axios.get(`${NOW_URL}/token`).then(res => {
        this.uploadData = {
          key: `logo/${suffix.join(".")}_${new Date().getTime()}.${ext}`,
          token: res.data
        };
      });
    }
  }
};
</script>


<style lang="scss" scoped>
.logo {
  object-fit: contain;
  width: 178px;
  height: 178px;
  display: block;
}
.container {
  width: 80%;
  margin: 0 auto;
  .notify {
    width: 100%;
    display: flex;
    flex-direction: row;

    .left {
      width: 50%;
    }
    .right {
      width: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      p {
        font-size: 0.8rem;
        font-weight: 300;
      }
      .title {
        font-size: 1rem;
        font-weight: 900;
      }
    }
  }
}
</style>

<style lang="scss">
.logo-uploader {
  display: flex;
  .el-upload {
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
}
.logo-uploader .el-upload:hover {
  border-color: grey;
}
.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.crowdTime .el-date-editor {
  width: 100%;
}
</style>

