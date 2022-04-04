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

/**
 * Get stake amount of wallet address in pool with pool id
 * @param {string} address wallet address
 * @param {number=} poolId pool id
 * @returns {Promise}
 */
const getWalletStakeAmount = async (address, poolId = 0) => {
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

  return bigNumberHelper.fromDecimals(amount);
};

/**
 * Check if the wallet with wallet address have stake more than min stake amount
 * @param {string} address wallet address
 * @param {number} minStakeAmount min stake amount
 * @param {number} poolId pool id
 * @returns {Promise}
 */
const isValidStaker = async (
  address,
  minStakeAmount = 0,
  tokenBasePrice = 1,
  poolId = 0
) => {
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

  return bigNumberHelper.gte(
    bigNumberHelper
      .fromDecimals(amount)
      .mulUnsafe(FixedNumber.from(tokenBasePrice)),
    FixedNumber.from(minStakeAmount)
  );
};

module.exports = {
  checkUserStaked,
  getWalletStakeAmount,
  isValidStaker,
};
