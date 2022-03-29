const { getWeb3 } = require(".");
const { bigNumberHelper } = require("../bignumber-helper");
const { FixedNumber } = require("@ethersproject/bignumber");

const CONFIG = {
  dev: {
    farmAddress: "0x071f6ee2BFa32740dC95e0593579d814c2e60630",
    chainId: 97,
  },
  // prod: {
  //   farmAddress: "",
  //   chainId: 56,
  // },
  prod: {
    farmAddress: "0x071f6ee2BFa32740dC95e0593579d814c2e60630",
    chainId: 97,
  },
};

const checkUserStaked = async (poolId, address) => {
  const { farmAddress, chainId } =
    process.env.NODE_ENV === "production" ? CONFIG.prod : CONFIG.dev;

  const web3 = getWeb3(chainId);
  const farmContract = new web3.eth.Contract(
    require("./farm.abi.json"),
    farmAddress
  );

  const { amount } = await farmContract.methods
    .userInfo(poolId, address)
    .call();

  const userStakedAmount = bigNumberHelper.fromDecimals(amount);
  return bigNumberHelper.gt(userStakedAmount, FixedNumber.from("0"));
};

module.exports = {
  checkUserStaked,
};
