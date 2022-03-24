const { BigNumber, FixedNumber } = require("@ethersproject/bignumber");

class BigNumberHelper {
  /**
   * Greater than
   */
  gt(first, second) {
    const diff = first.subUnsafe(second);
    return !diff.isZero() && !diff.isNegative();
  }

  gte(first, second) {
    const diff = first.subUnsafe(second);
    return !diff.isNegative();
  }

  /**
   * Less than
   */
  lt(first, second) {
    return first.subUnsafe(second).isNegative();
  }

  lte(first, second) {
    const diff = first.subUnsafe(second);
    return diff.isZero() || diff.isNegative();
  }

  getDecimals(decimals = 18) {
    return FixedNumber.from(BigNumber.from("10").pow(decimals).toString());
  }

  fromDecimals(amount, decimals = 18) {
    return FixedNumber.from(`${amount}`).divUnsafe(this.getDecimals(+decimals));
  }

  toDecimalString(fx, decimals = 18) {
    fx = FixedNumber.from(fx.toString());
    const num = fx.mulUnsafe(this.getDecimals(+decimals));
    // xxx.0 => take xxx
    return num.toString().split(".")[0];
  }

  getSolDecimals(decimals = 9) {
    return this.getDecimals(decimals);
  }

  fromSolDecimals(amount, decimals = 9) {
    return this.fromDecimals(amount || "0", decimals);
  }
}

const bigNumberHelper = new BigNumberHelper();

module.exports = {
  bigNumberHelper,
};
