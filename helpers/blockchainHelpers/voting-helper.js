const { getWeb3 } = require(".");
const { bigNumberHelper } = require("../bignumber-helper");
const { FixedNumber } = require("@ethersproject/bignumber");

const CONFIG = {
  dev: {
    votingAddress: "0xAaf25d840e4b4934777A21F00EA31bB609fa324b",
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
    const poolInfo = await farmContract.methods.poolInfos(poolId).call();
    return poolInfo;
  } catch (error) {
    // poolId not exist
    return null;
  }
};

module.exports = {
  getPoolInfo,
};
