const Web3 = require("web3");
const moment = require("moment");
const VOTING_ABI = require("./abis/voting.abi.json");
const {
  getChainConfig,
  getVotingContractCreation,
} = require("./blockchainHandler");
const { FixedNumber } = require("@ethersproject/bignumber");
const { fromDecimals } = require("../helpers/bignumber-helper");
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
    const contractCreation = getVotingContractCreation(chainId);
    cacheds[chainId] = {
      address,
      chainId,
      web3,
      network: name,
      contract: new web3.eth.Contract(VOTING_ABI, address),
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

const processEvent = async (configs, data) => {
  const eventData = data.returnValues;
  const timestamp = await getBlockTimestamp(configs.web3, data.blockNumber);
  data.timestamp = timestamp;
  if (data.event === "PoolCreated") {
    console.log("=== data.eventName: ", data.event, data.timestamp);
    // do something
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
          listenVotingContract(configs);
        }, 1000);
      }
    })
    .on("connected", (str) => {
      console.log(`- Connected to ${configs.network} mainnet by Id: ${str}`);
    });
};

const startEventListener = (address, chainId, eventName) => {
  console.log("=== startEventListener: ", address, chainId, eventName);
  const configs = getConfigs(address, chainId);
  listenVotingContract(configs, eventName);
};

const listenVotingContract = (configs, eventName) => {
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

module.exports = { startEventListener };
