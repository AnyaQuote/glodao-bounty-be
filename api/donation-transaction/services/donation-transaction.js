"use strict";
const { toNumber } = require("lodash");
const moment = require("moment");
const Web3 = require("web3");
const { getTransactionReceipt } = require("../../../helpers/blockchain-helper");
const erc20ABI = require("../../../helpers/blockchainHelpers/abis/erc20.abi.json");
const abiDecoder = require("abi-decoder");
abiDecoder.addABI(erc20ABI);
const RPC_URL = process.env.BSC_RPC_URL;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Record donation and store in db
 * @param {string} tx transaction hash
 * @returns new transaction record
 */
const recordDonation = async (tx) => {
  const web3 = new Web3(RPC_URL);
  const res = await getTransactionReceipt(tx, web3);
  const { transactionHash, from, logs: baseLogs } = res;
  const logs = abiDecoder.decodeLogs(baseLogs);
  const amountStr = Web3.utils.fromWei(logs[0].events[2].value);
  const hunter = await strapi.services.hunter.findOne({ address: from });

  return await strapi.services["donation-transaction"].create({
    hash: tx,
    amount: toNumber(amountStr),
    amountStr: amountStr,
    wallet: from,
    date: moment().toISOString(),
    hunter: hunter ? hunter.id : undefined,
  });
};

module.exports = {
  recordDonation,
};
