const { getWeb3 } = require(".");
const { bigNumberHelper } = require("../bignumber-helper");
const { FixedNumber } = require("@ethersproject/bignumber");

const CONFIG = {
  dev: {
    votingAddress: "0xd5B16fd0F74725B19ce498F4cf4956421E5F63C9",
    votingAddressV2: "0x91Ad055d0cfA31E859FD97560a963F46Dc49AC2B",
    chainId: 97,
  },
  prod: {
    votingAddress: "0x7edb25616977cDeCF9Ca7adcA2a34e1F8461A4B9",
    votingAddressV2: "0xAd01dcBC0e8476593619D78C2b32F7Cbd4F0fee1",
    chainId: 56,
  },
};

const getPoolInfo = async (votingPoolData) => {
  let farmContract = {};
  if (votingPoolData.version === "v2") {
    const { votingAddressV2, chainId } =
      process.env.NODE_ENV === "production" ? CONFIG.prod : CONFIG.dev;

    const web3 = getWeb3(chainId);
    farmContract = new web3.eth.Contract(
      require("./abis/voting.abi.v2.json"),
      votingAddressV2
    );
  } else {
    const { votingAddress, chainId } =
      process.env.NODE_ENV === "production" ? CONFIG.prod : CONFIG.dev;

    const web3 = getWeb3(chainId);
    farmContract = new web3.eth.Contract(
      require("./abis/voting.abi.json"),
      votingAddress
    );
  }

  try {
    const poolInfo = await farmContract.methods
      .poolInfos(+votingPoolData.poolId)
      .call();
    return poolInfo;
  } catch (error) {
    console.error(error);
    // poolId not exist
    return null;
  }
};

module.exports = {
  getPoolInfo,
};
