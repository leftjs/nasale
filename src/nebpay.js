import NP from "nebpay.js";
import axios from "axios";

export default class NebPay {
  /**
   *
   * @param {*} net main | test(default)
   */
  constructor() {
    this.callbackUrl = NP.config.mainnetUrl;

    // this.callbackUrl = NP.config.testnetUrl;

    this.nebpay = new NP();
  }

  static checkState(txhash, success, failure) {
    const url = "https://mainnet.nebulas.io/v1/user/getTransactionReceipt";
    // const url = "https://testnet.nebulas.io/v1/user/getTransactionReceipt";
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    axios
      .post(url, { hash: txhash.txhash })
      .then(async res => {
        const status = res.data.result.status;

        if (status == 1) {
          success(res.data.result);
        } else if (status == 0) {
          fail(res.data.result);
        } else {
          await sleep(5000);
          NebPay.checkState(txhash, success, failure);
        }
      })
      .catch(async err => {
        console.log(err);
        await sleep(5000);
        NebPay.checkState(txhash, success, failure);
      });
  }

  call(to, value, callFuntion, args) {
    return new Promise((resolve, reject) => {
      this.nebpay.call(to, value, callFuntion, args, {
        listener: resolve
      });
    });
  }

  simulateCall(to, value, callFuntion, args) {
    return new Promise((resolve, reject) => {
      this.nebpay.simulateCall(to, value, callFuntion, args, {
        listener: resolve
      });
    });
  }
}
