const Web3 = require("web3");
const moment = require("moment");
const MARKETPLACE_ABI = require("./abis/marketplace.abi.json");
const {
  getChainConfig,
  getMarketplaceContractCreation,
} = require("./blockchainHandler");
const { FixedNumber } = require("@ethersproject/bignumber");
const { fromDecimals } = require("../helpers/bignumber-helper");
const { createOrUpdateStatistic } = require("./model/marketStatistic/services");
const { createTransaction } = require("./model/transaction/services");
const options = {
  timeout: 30000,
  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000, // ms
  },

  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false,
  },
};

let cacheds = {};
let transactionNum = 0;

const getConfigs = (address, chainId) => {
  if (!cacheds[chainId]) {
    const { rpc, name, ws } = getChainConfig(chainId);
    const web3 = new Web3(ws, options);
    const contractCreation = getMarketplaceContractCreation(chainId);
    cacheds[chainId] = {
      address,
      chainId,
      web3,
      network: name,
      contract: new web3.eth.Contract(MARKETPLACE_ABI, address),
      contractCreation,
    };
  }
  return cacheds[chainId];
};

const getBlockTimestamp = async (web3, blockNumber) => {
  const transactionBlock = await web3.eth.getBlock(blockNumber);
  const timestamp = moment.unix(transactionBlock.timestamp);
  return timestamp;
};

const getTransactionQuery = (configs, eventData, data) => {
  return {
    chainId: +configs.chainId,
    nftId: eventData.keyId,
    buyerAddress: eventData.buyer,
    sellerAddress: eventData.seller,
    salePrice: fromDecimals(eventData.price).toString(),
    transactionHash: data.transactionHash,
    data: {
      orderId: eventData.orderId,
      contractAddress: data.address,
      blockNumber: data.blockNumber,
      transactionIndex: data.transactionIndex,
      blockHash: data.blockHash,
      raw: data.raw,
      signature: data.signature,
    },
    timestamp: data.timestamp,
    type: data.eventName,
  };
};

const getStatisticQuery = (configs, eventData, data) => {
  return {
    chainId: +configs.chainId,
    price: fromDecimals(eventData.price),
    timestamp: data.timestamp,
  };
};

const processEvent = async (configs, data) => {
  const eventData = data.returnValues;
  const timestamp = await getBlockTimestamp(configs.web3, data.blockNumber);
  data.timestamp = timestamp;
  const transactionQuery = getTransactionQuery(configs, eventData, data);
  const newTransaction = await createTransaction(transactionQuery);
  if (newTransaction && data.eventName === "OrderBought") {
    const statisticQuery = getStatisticQuery(configs, eventData, data);
    await createOrUpdateStatistic(statisticQuery);
  }
};

const getEventListener = async (configs, eventName) => {
  const currentBlock = await configs.web3.eth.getBlockNumber();
  return configs.contract.events[eventName]({
    fromBlock: currentBlock,
  })
    .on("data", async (data) => {
      if (!data || !data.event || data.event !== eventName) return;
      data.event = eventName;
      await processEvent(configs, data);
    })
    .on("error", (err) => {
      if (err) {
        console.log(
          `*** Error occured when connecting to ${configs.network}. ${err} ***`
        );
        console.log(`*** Reconnecting to ${configs.network} ***`);
        setTimeout(async () => {
          listenMarketplaceContract(configs);
        }, 1000);
      }
    })
    .on("connected", (str) => {
      console.log(`- Connected to ${configs.network} mainnet by Id: ${str}`);
    });
};

const startEventListener = (address, chainId, eventName) => {
  const configs = getConfigs(address, chainId);
  listenMarketplaceContract(configs, eventName);
};

const listenMarketplaceContract = (configs, eventName) => {
  try {
    console.log(
      `*** ${moment().format("DD/MM/YYYY HH:mm:ss")} start listen network ${
        configs.network
      } - Event ${eventName} ***`
    );
    getEventListener(configs, eventName);
  } catch (err) {
    console.error(`===== Error when starting block subscription =====`);
    console.error(`Error: ${err}`);
    console.error(`===== Error =====`);
  }
};

const getMarketplacePastTransactions = async (
  configs,
  eventName,
  startBlock,
  endBlock
) => {
  let options = {
    filter: {},
    fromBlock: startBlock,
    toBlock: endBlock,
  };
  const results = await configs.contract
    .getPastEvents(eventName, options)
    .catch((err) => console.log(err));
  return results;
};

const processPastTransactions = async (address, chainId, eventName) => {
  const configs = getConfigs(address, chainId);
  const latestBlock = await configs.web3.eth.getBlockNumber();
  const creationBlock = configs.contractCreation.blockNumber;

  let index = 1;
  let endBlock = latestBlock;
  let startBlock = endBlock - 1000;

  do {
    console.log(`=== ${eventName} - Page ${index} ===`);
    const transactions = await getMarketplacePastTransactions(
      configs,
      eventName,
      startBlock,
      endBlock
    );
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      transaction.eventName = eventName;
      await processEvent(configs, transaction);
    }
    endBlock = startBlock;
    startBlock = endBlock - 1000;
    index++;
  } while (endBlock > creationBlock);
  console.log("=== Done process past transactions ===");
};

module.exports = { startEventListener, processPastTransactions };

// processPastTransactions(
//   "0x70eC8Cf0F4CFE68024CB59bEBe2f7Ada402B1fF0",
//   56,
//   "OrderCreated"
// );
// startEventListener(
//   "0x70eC8Cf0F4CFE68024CB59bEBe2f7Ada402B1fF0",
//   56,
//   "OrderCreated"
// );
// startEventListener(
//   "0x70eC8Cf0F4CFE68024CB59bEBe2f7Ada402B1fF0",
//   56,
//   "OrderBought"
// );
