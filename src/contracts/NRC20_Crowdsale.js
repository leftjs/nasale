"use strict";

var Allowed = function(obj) {
  this.allowed = {};
  this.parse(obj);
};

Allowed.prototype = {
  toString: function() {
    return JSON.stringify(this.allowed);
  },

  parse: function(obj) {
    if (typeof obj != "undefined") {
      var data = JSON.parse(obj);
      for (var key in data) {
        this.allowed[key] = new BigNumber(data[key]);
      }
    }
  },

  get: function(key) {
    return this.allowed[key];
  },

  set: function(key, value) {
    this.allowed[key] = new BigNumber(value);
  }
};

var StandardToken = function() {
  LocalContractStorage.defineProperties(this, {
    _owner: null, // token onwer
    _name: null,
    _symbol: null,
    _decimals: null,
    _totalSupply: {
      parse: function(value) {
        return new BigNumber(value);
      },
      stringify: function(o) {
        return o.toString(10);
      }
    },
    _rate: {
      // How many token units a buyer gets per wei
      parse: function(value) {
        return new BigNumber(value);
      },
      stringify: function(o) {
        return o.toString(10);
      }
    },
    _cap: {
      // 众筹数量
      parse: function(value) {
        return new BigNumber(value);
      },
      stringify: function(o) {
        return o.toString(10);
      }
    },
    _weiRasised: {
      // 已众筹
      parse: function(value) {
        return new BigNumber(value);
      },
      stringify: function(o) {
        return o.toString(10);
      }
    }, // Amount of wei raised
    _openingTime: {
      parse: function(value) {
        return new BigNumber(value);
      },
      stringify: function(o) {
        return o.toString(10);
      }
    },
    _endingTime: {
      parse: function(value) {
        return new BigNumber(value);
      },
      stringify: function(o) {
        return o.toString(10);
      }
    }
  });

  LocalContractStorage.defineMapProperties(this, {
    balances: {
      parse: function(value) {
        return new BigNumber(value);
      },
      stringify: function(o) {
        return o.toString(10);
      }
    },
    allowed: {
      parse: function(value) {
        return new Allowed(value);
      },
      stringify: function(o) {
        return o.toString();
      }
    }
  });
};

StandardToken.prototype = {
  init: function(
    name,
    symbol,
    decimals,
    totalSupply,
    rate,
    cap,
    openingTime,
    endingTime
  ) {
    this._name = name;
    this._symbol = symbol;
    this._decimals = decimals || 0;
    this._totalSupply = new BigNumber(totalSupply).mul(
      new BigNumber(10).pow(decimals)
    );
    this._openingTime = new BigNumber(openingTime);
    this._endingTime = new BigNumber(endingTime);
    this._rate = new BigNumber(rate);
    this._cap = new BigNumber(cap);
    this._weiRasised = new BigNumber(0);
    var from = Blockchain.transaction.from;
    this._owner = from;
    this.balances.set(from, this._totalSupply);
    this.transferEvent(true, from, from, this._totalSupply);
  },

  // Returns the name of the token
  name: function() {
    return this._name;
  },

  // Returns the symbol of the token
  symbol: function() {
    return this._symbol;
  },

  // Returns the number of decimals the token uses
  decimals: function() {
    return this._decimals;
  },

  totalSupply: function() {
    return this._totalSupply.toString(10);
  },

  rate: function() {
    return this._rate.toString(10);
  },

  balanceOf: function(owner) {
    var balance = this.balances.get(owner);

    if (balance instanceof BigNumber) {
      return balance.toString(10);
    } else {
      return "0";
    }
  },

  info: function() {
    return {
      name: this._name,
      symbol: this._symbol,
      decimals: this._decimals,
      totalSupply: this._totalSupply.toString(10),
      rate: this._rate.toString(10),
      openingTime: this._openingTime.toString(10),
      endingTime: this._endingTime.toString(10),
      cap: this._cap.toString(10),
      weiRasised: this._weiRasised.toString(10),
      owner: this._owner,
      currentTime: Blockchain.transaction.timestamp
    };
  },

  _mustOwner: function() {
    if (Blockchain.transaction.from != this._owner) {
      throw new Error("don't do this.");
    }
  },

  buyTokens: function(beneficiary) {
    var weiAmount = Blockchain.transaction.value;
    this._preValidatePurchase(beneficiary, weiAmount);
    var tokens = this._getTokenAmount(weiAmount);
    this.weiRasised = this._weiRasised.add(weiAmount);
    var from = Blockchain.transaction.from;
    this.tokenPruchaseEvent(true, from, beneficiary, weiAmount, tokens);
    this._tempApprove(from, 0, tokens);
    this.transferFrom(this._owner, beneficiary, tokens);
    this._forwardFunds();
    this._postPurchase(weiAmount);
  },

  tokenPruchaseEvent: function(status, purchaser, beneficiary, value, amount) {
    Event.Trigger(this.name(), {
      Status: status,
      Transfer: {
        purchaser: purchaser,
        beneficiary: beneficiary,
        value: value,
        amount: amount
      }
    });
  },

  _mustWalletAddress: function(address) {
    if (Blockchain.verifyAddress(address) != 87) {
      throw new Error("invalid wallet address.");
    }
  },

  _preValidatePurchase: function(beneficiary, weiAmount) {
    // return {
    //   weiAmount: weiAmount,
    //   BNweiAmount: new BigNumber(weiAmount),
    //   weiRasised: this._weiRasised,
    //   BNweiRasised: new BigNumber(this._weiRasised),
    //   cap: this._cap,
    //   BNcap: new BigNumber(this._cap),
    //   num1: new BigNumber(weiAmount).plus(new BigNumber(this._weiRasised)),
    //   num2: new BigNumber(this._cap)
    // };
    if (this._cap.lte(this._weiRasised)) {
      throw new Error("no enough amount to sale");
    }
    var currentTime = new BigNumber(Blockchain.transaction.timestamp);
    if (this._endingTime.lt(currentTime) || this._openingTime.gt(currentTime)) {
      throw new Error("invalid buy time");
    }
    this._mustWalletAddress(beneficiary);
    if (beneficiary == this._owner) {
      throw new Error("invalid beneficiary");
    }
    if (new BigNumber(weiAmount).lte(new BigNumber(0))) {
      throw new Error("invalid weiAmount");
    }
    if (
      new BigNumber(weiAmount)
        .plus(new BigNumber(this._weiRasised))
        .gt(new BigNumber(this._cap))
    ) {
      throw new Error("too large weiAmount");
    }
  },

  _postPurchase: function(weiAmount) {
    this._weiRasised = new BigNumber(this._weiRasised).plus(
      new BigNumber(weiAmount)
    );
  },

  _getTokenAmount: function(weiAmount) {
    return new BigNumber(weiAmount).mul(this._rate);
  },

  _forwardFunds: function() {
    Blockchain.transfer(this._owner, Blockchain.transaction.value);
  },

  transfer: function(to, value) {
    value = new BigNumber(value);
    if (value.lt(0)) {
      throw new Error("invalid value.");
    }

    var from = Blockchain.transaction.from;
    var balance = this.balances.get(from) || new BigNumber(0);

    if (balance.lt(value)) {
      throw new Error("transfer failed.");
    }

    this.balances.set(from, balance.sub(value));
    var toBalance = this.balances.get(to) || new BigNumber(0);
    this.balances.set(to, toBalance.add(value));

    this.transferEvent(true, from, to, value);
  },

  transferFrom: function(from, to, value) {
    var spender = Blockchain.transaction.from;
    var balance = this.balances.get(from) || new BigNumber(0);

    var allowed = this.allowed.get(from) || new Allowed();
    var allowedValue = allowed.get(spender) || new BigNumber(0);
    value = new BigNumber(value);

    if (value.gte(0) && balance.gte(value) && allowedValue.gte(value)) {
      this.balances.set(from, balance.sub(value));

      // update allowed value
      allowed.set(spender, allowedValue.sub(value));
      this.allowed.set(from, allowed);

      var toBalance = this.balances.get(to) || new BigNumber(0);
      this.balances.set(to, toBalance.add(value));

      this.transferEvent(true, from, to, value);
    } else {
      throw new Error("transfer failed.");
    }
  },

  transferEvent: function(status, from, to, value) {
    Event.Trigger(this.name(), {
      Status: status,
      Transfer: {
        from: from,
        to: to,
        value: value
      }
    });
  },

  _tempApprove: function(spender, currentValue, value) {
    var from = this._owner;

    var oldValue = this.allowance(from, spender);
    if (oldValue != currentValue.toString()) {
      throw new Error("current approve value mistake.");
    }

    var balance = new BigNumber(this.balanceOf(from));
    value = new BigNumber(value);

    if (value.lt(0) || balance.lt(value)) {
      throw new Error("invalid value.");
    }

    var owned = this.allowed.get(from) || new Allowed();
    owned.set(spender, value);

    this.allowed.set(from, owned);

    this.approveEvent(true, from, spender, value);
  },

  approve: function(spender, currentValue, value) {
    var from = Blockchain.transaction.from;

    var oldValue = this.allowance(from, spender);
    if (oldValue != currentValue.toString()) {
      throw new Error("current approve value mistake.");
    }

    var balance = new BigNumber(this.balanceOf(from));
    value = new BigNumber(value);

    if (value.lt(0) || balance.lt(value)) {
      throw new Error("invalid value.");
    }

    var owned = this.allowed.get(from) || new Allowed();
    owned.set(spender, value);

    this.allowed.set(from, owned);

    this.approveEvent(true, from, spender, value);
  },

  approveEvent: function(status, from, spender, value) {
    Event.Trigger(this.name(), {
      Status: status,
      Approve: {
        owner: from,
        spender: spender,
        value: value
      }
    });
  },

  allowance: function(owner, spender) {
    var owned = this.allowed.get(owner);

    if (owned instanceof Allowed) {
      var spender = owned.get(spender);
      if (typeof spender != "undefined") {
        return spender.toString(10);
      }
    }
    return "0";
  }
};

module.exports = StandardToken;
