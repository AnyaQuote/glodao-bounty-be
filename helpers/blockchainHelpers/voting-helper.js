const { getWeb3 } = require(".");
const { bigNumberHelper } = require("../bignumber-helper");
const { FixedNumber } = require("@ethersproject/bignumber");

const CONFIG = {
  dev: {
    votingAddress: "0xCEb2E361B1B3fB0E44BC337D459A36f4CA467869",
    chainId: 97,
  },
  prod: {
    votingAddress: "",
    chainId: 56,
  },
};

const getPoolInfo = async (poolId) => {
  const { votingAddress, chainId } =
    process.env.NODE_ENV === "production" ? CONFIG.prod : CONFIG.dev;

  const web3 = getWeb3(chainId);
  const farmContract = new web3.eth.Contract(
    require("./abis/voting.abi.json"),
    votingAddress
  );

  try {
    const poolInfo = await farmContract.methods.poolInfos(+poolId).call();
    return poolInfo;
  } catch (error) {
    // poolId not exist
    return null;
  }
};

module.exports = {
  getPoolInfo,
};
