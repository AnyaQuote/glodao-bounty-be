"use strict";
const { toNumber, isEqual, toLower } = require("lodash");
const moment = require("moment");
const Web3 = require("web3");
const { getTransactionReceipt } = require("../../../helpers/blockchain-helper");
const erc20ABI = require("../../../helpers/blockchainHelpers/abis/erc20.abi.json");
const abiDecoder = require("abi-decoder");
abiDecoder.addABI(erc20ABI);

const RPC_URL = process.env.BSC_RPC_URL;
const DONATION_DESTINATION_ADDRESS = process.env.DONATION_DESTINATION_ADDRESS;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Record donation and store in db
 * @param {string} tx transaction hash
 * @returns new transaction record
 */
const recordDonation = async (tx, username) => {
  const web3 = new Web3(RPC_URL);
  const res = await getTransactionReceipt(tx, web3);
  const { transactionHash, from, to, logs: baseLogs } = res;
  const logs = abiDecoder.decodeLogs(baseLogs);
  console.log(logs);
  console.log(logs[0].events[1]);
  const amountStr = Web3.utils.fromWei(logs[0].events[2].value);
  console.log(to);
  console.log(DONATION_DESTINATION_ADDRESS);
  if (
    !isEqual(
      toLower(logs[0].events[1].value),
      toLower(DONATION_DESTINATION_ADDRESS)
    )
  )
    throw new Error("Invalid donation destination address");
  const hunter = await strapi.services.hunter.findOne({ address: from });

  return await strapi.services["donation-transaction"].create({
    hash: tx,
    amount: toNumber(amountStr),
    amountStr: amountStr,
    wallet: from,
    date: moment().toISOString(),
    hunter: hunter ? hunter.id : undefined,
    username,
  });
};

module.exports = {
  recordDonation,
};
