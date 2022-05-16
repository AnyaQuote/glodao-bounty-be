const solidityWatcher = require("./solidityWatcher");
const solanaWatcher = require("./solanaWatcher");
const MongoDB = require("./database/mongodb");
const MarketStatisticModel = require("./model/marketStatistic/index.js");
const TransactionModel = require("./model/transaction/index.js");
const moment = require("moment");

const { getMarketplaceContract } = require("./blockchainHandler");

const chainId = process.env.CHAIN_ID || 97;

const init = async () => {
  const db = await MongoDB.init();
  await MarketStatisticModel.init(db);
  await TransactionModel.init(db);
};

const startListenMarketEvent = async () => {
  const marketContractAddress = getMarketplaceContract(chainId);
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
      solidityWatcher.processPastTransactions(
        marketContractAddress,
        chainId,
        "PoolCreated"
      );
      solidityWatcher.startEventListener(
        marketContractAddress,
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

startListenMarketEvent();
