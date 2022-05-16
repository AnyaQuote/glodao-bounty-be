const solidityWatcher = require("./solidityWatcher");
const MongoDB = require("./database/mongodb");
const VotingPoolModel = require("./model/votingPool/index.js");

const { getVotingContract } = require("./blockchainHandler");

const chainId = process.env.CHAIN_ID || 97;

const init = async () => {
  const db = await MongoDB.init();
  await VotingPoolModel.init(db);
};

const startListenVotingEvent = async () => {
  const votingContractAddress = getVotingContract(chainId);
  await init();
  switch (chainId) {
    case 1:
    case 3:
    case 56:
    case 97:
    case "1":
    case "3":
    case "56":
    case "97":
      solidityWatcher.startEventListener(
        votingContractAddress,
        chainId,
        "PoolCreated"
      );
      break;
    case 101:
    case 103:
    case "101":
    case "103":
      break;
  }
};

startListenVotingEvent();
