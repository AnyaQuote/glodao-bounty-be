const { FixedNumber } = require("@ethersproject/bignumber");

const {
  EventManager,
  Program,
  ProgramError,
  Provider,
  EventParser,
} = require("@project-serum/anchor");
const { BN, web3 } = require("@project-serum/anchor");
const { utf8 } = require("@project-serum/anchor/dist/cjs/utils/bytes");
const { PublicKey } = require("@solana/web3.js");
const moment = require("moment");
const { SystemProgram, Keypair, Transaction } = web3;
const { getChainConfig, getSolanaConfig } = require("./blockchainHandler");
const {
  ConfirmOptions,
  Connection,
  SendTransactionError,
  Wallet,
} = require("@solana/web3.js");
const { fromSolDecimals } = require("../helpers/bignumber-helper");
const { sleep } = require("../helpers/utils");
const { createOrUpdateStatistic } = require("./model/marketStatistic/services");
const { createTransaction } = require("./model/transaction/services");
const marketplaceIDL = require("./abis/waggle_market_place.json");
const MARKETPLACE_ID = "8SZCLQNjYhXtnxYTNP2sCQdTHDPjkgAHzBdFvgcdAX6k";

let cacheds = {};

let provider;
let marketProgram;

const getConfigs = (address, chainId) => {
  if (!cacheds[chainId]) {
    const { rpc, name, ws } = getChainConfig(chainId);
    const opts = {
      preflightCommitment: "confirmed",
      commitment: "confirmed",
    };
    const connection = new Connection(rpc, opts);
    const provider = new Provider(connection, undefined, opts);
    marketProgram = new Program(marketplaceIDL, address, provider);
    const subscriptionConnection = new Connection(ws, opts);
    const subscriptionProvider = new Provider(
      subscriptionConnection,
      undefined,
      opts
    );
    subscriptionMarketProgram = new Program(
      marketplaceIDL,
      address,
      subscriptionProvider
    );
    cacheds[chainId] = {
      address,
      chainId,
      provider,
      marketProgram,
      subscriptionMarketProgram,
      network: name,
      connection,
      subscriptionConnection,
    };
  }
  return cacheds[chainId];
};

const getTransactionQuery = (configs, eventData, data) => {
  const timestamp = moment.unix(data.blockTime);
  let query = {
    chainId: +configs.chainId,
    nftId: new BN(eventData.contributeId).toNumber(),
    buyerAddress: eventData.buyer ? eventData.buyer.toString() : "",
    sellerAddress: eventData.seller ? eventData.seller.toString() : "",
    salePrice: fromSolDecimals(eventData.price, 6).toString(),
    timestamp: timestamp.toISOString(),
    type: data.eventName,
    data,
  };
  if (data.transaction && data.transaction.signatures)
    query.transactionHash = data.transaction.signatures[0];
  return query;
};

const getStatisticQuery = (configs, eventData, data) => {
  const timestamp = moment.unix(data.blockTime);
  return {
    chainId: +configs.chainId,
    price: fromSolDecimals(eventData.price, 6),
    timestamp,
  };
};

const processEvent = async (configs, eventData, data) => {
  const transactionQuery = getTransactionQuery(configs, eventData, data);

  // console.log("transactionQuery", transactionQuery);

  const newTransaction = await createTransaction(transactionQuery);
  if (newTransaction && data.eventName === "OrderBought") {
    const statisticQuery = getStatisticQuery(configs, eventData, data);
    // console.log("statisticQuery", statisticQuery);
    await createOrUpdateStatistic(statisticQuery);
  }
};

const startEventListener = (address, chainId, eventName) => {
  const configs = getConfigs(address, chainId, true);
  listenMarketplaceContracts(configs, eventName);
};

const listenMarketplaceContracts = (configs, eventName) => {
  try {
    console.log(
      `*** ${moment().format("DD/MM/YYYY HH:mm:ss")} start listen network ${
        configs.network
      } Event ${eventName} ***`
    );
    const program = configs.subscriptionMarketProgram;
    program.addEventListener(eventName, async (eventData) => {
      const transaction = await getLastBoughtTransaction(configs, eventName);
      await processEvent(configs, eventData, transaction);
    });
  } catch (err) {
    console.error(`===== Error when starting block subscription =====`);
    console.error(`Error: ${err}`);
    console.error(`===== Error =====`);
  }
};

const getLastBoughtTransaction = async (configs, eventName) => {
  let lastSignature;
  let lastTransaction;
  let isValidTransaction = false;
  do {
    let options = {
      limit: 1,
    };
    if (lastSignature) options.before = lastSignature;
    const fetchSignatures =
      await configs.connection.getConfirmedSignaturesForAddress2(
        new PublicKey(configs.address),
        options
      );
    if (!fetchSignatures || !fetchSignatures.length === 0) return;
    lastSignature = fetchSignatures[0].signature;
    const transaction = await configs.connection.getTransaction(lastSignature);
    if (
      transaction.meta &&
      transaction.meta.logMessages &&
      isEventTransaction(transaction.meta.logMessages, eventName)
    ) {
      lastTransaction = transaction;
      isValidTransaction = true;
    }
  } while (!isValidTransaction);
  return lastTransaction;
};

const getMarketplacePastTransactions = async (configs) => {
  let transactions = [];
  let fetchSignatures = [];
  let page = 1;
  do {
    console.log(`- Fetching confirmed signatures page ${page}`);
    let options = {
      limit: 100,
    };
    if (page != 1)
      options.before = fetchSignatures[fetchSignatures.length - 1].signature;
    fetchSignatures =
      await configs.connection.getConfirmedSignaturesForAddress2(
        new PublicKey(configs.address),
        options
      );
    const signatures = fetchSignatures.map(
      (transaction) => transaction.signature
    );
    if (!signatures || signatures.length === 0) break;
    const confirmedTransactions =
      await configs.connection.getParsedConfirmedTransactions(signatures);
    transactions = [...transactions, ...confirmedTransactions];
    await sleep(1000);
    page++;
  } while (fetchSignatures && fetchSignatures.length > 0);
  return transactions;
};

const processPastTransaction = async (configs, eventParser, transaction) => {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(async () => {
      if (
        transaction.eventName === "OrderBought" &&
        transaction.meta &&
        transaction.meta.innerInstructions &&
        transaction.meta.innerInstructions.length > 0
      ) {
        const transactionDetail = transaction.transaction;
        const buyerAddress =
          transactionDetail.message.instructions[0].accounts[6];
        const sellerAddress =
          transactionDetail.message.instructions[0].accounts[8];
        const innerInstructions =
          transaction.meta.innerInstructions[0].instructions;
        const salePrice = innerInstructions[0].parsed.info.amount;
        const eventData = {
          buyer: buyerAddress,
          seller: sellerAddress,
          price: salePrice,
          contributeId: 0,
        };
        await processEvent(configs, eventData, transaction);
        resolve(`Event ${transaction.eventName} found!`);
      } else {
        resolve("No event found!");
      }
    }, 500);
    try {
      eventParser.parseLogs(transaction.meta.logMessages, async (event) => {
        clearTimeout(timeout);
        if (event.name === transaction.eventName) {
          const eventData = event.data;
          console.log(`${transaction.eventName} event found!`);
          resolve(await processEvent(configs, eventData, transaction));
        } else {
          resolve(`No ${transaction.eventName} event found`);
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      resolve(error);
    }
  });
};

const isEventTransaction = (logMessages, eventName) => {
  if (!logMessages || logMessages.length === 0) return false;
  switch (eventName) {
    case "OrderBought":
      return logMessages.findIndex((log) => log.includes("BuyOrder")) !== -1;
    case "OrderCreated":
      return logMessages.findIndex((log) => log.includes("CreateOrder")) !== -1;
    default:
      return false;
  }
};

const processPastTransactions = async (address, chainId, eventName) => {
  try {
    const configs = getConfigs(address, chainId);
    const transactions = await getMarketplacePastTransactions(configs);
    if (!transactions || transactions.length === 0) return;
    console.log("transactions length", transactions.length);
    const eventParser = new EventParser(
      configs.marketProgram.programId,
      configs.marketProgram.coder
    );
    let totalTransaction = 0;
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      if (
        !transaction.meta ||
        !transaction.meta.logMessages ||
        transaction.meta.logMessages.length === 0 ||
        !isEventTransaction(transaction.meta.logMessages, eventName)
      ) {
        continue;
      }
      transaction.eventName = eventName;
      await processPastTransaction(configs, eventParser, transaction);
      totalTransaction++;
    }
    console.log("totalTransaction", totalTransaction);
  } catch (error) {
    console.log("======", error);
  }
};

const getTotalStatistic = async (address, chainId) => {
  const configs = getConfigs(address, chainId);
  const [stateSigner] = await PublicKey.findProgramAddress(
    [utf8.encode("state")],
    configs.marketProgram.programId
  );
  const transactionCount =
    await configs.marketProgram.account.stateAccount.fetch(stateSigner);
  console.log(
    "transactionCount successedOrder",
    new BN(transactionCount.successedOrder).toNumber()
  );
  console.log(
    "transactionCount totalTrade",
    fromSolDecimals(transactionCount.totalTrade, 6).toString()
  );
  console.log(
    "transactionCount totalOrder",
    new BN(transactionCount.totalOrder).toString()
  );
};

// startEventListener(
//   "8SZCLQNjYhXtnxYTNP2sCQdTHDPjkgAHzBdFvgcdAX6k",
//   103,
//   "OrderCreated"
// );
// processPastTransactions(
//   "8SZCLQNjYhXtnxYTNP2sCQdTHDPjkgAHzBdFvgcdAX6k",
//   103,
//   "OrderCreated"
// );
// getTotalStatistic("8SZCLQNjYhXtnxYTNP2sCQdTHDPjkgAHzBdFvgcdAX6k", 56);

module.exports = {
  startEventListener,
  processPastTransactions,
};
