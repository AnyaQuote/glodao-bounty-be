"use strict";
const { isEqual } = require("lodash");
const web3 = require("web3");
const {
  isSolidityAddress,
  verifySoliditySignature,
} = require("../../../helpers/wallet-helper");
const {
  getWalletStakeAmount,
} = require("../../../helpers/blockchainHelpers/farm-helper");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  verifySignMessage: async (ctx) => {
    const { walletAddress, signature, id, chain } = ctx.request.body;

    if (!walletAddress || !signature || !id || !chain)
      return ctx.badRequest("Invalid request body: missing fields");

    if (!isEqual(chain, "sol") && !isSolidityAddress(walletAddress))
      return ctx.badRequest(
        "Invalid wallet address: wallet address is not ETH chain"
      );

    const hunter = await strapi.services.hunter.findOne({
      id: id,
    });

    const isValidSignature = await verifySoliditySignature(
      walletAddress,
      signature,
      hunter.nonce
    );

    if (isValidSignature)
      return await strapi.services.hunter.updateHunterNonce(hunter);

    return ctx.badRequest("Fail to verify sign message");
  },
  updateWalletAddress: async (ctx) => {
    const { walletAddress, id } = ctx.request.body;

    const hunter = await strapi.services.hunter.findOne({
      id: id,
    });

    return await strapi.services.hunter.updateHunterWalletAddress(
      hunter,
      walletAddress
    );
  },
  checkUserStaked: async (ctx) => {
    const { poolId, address } = ctx.query;
    const isSolidityWallet = web3.utils.isAddress(address);
    if (poolId !== null && poolId !== undefined && isSolidityWallet) {
      return (await getWalletStakeAmount(address, poolId)).toString();
    } else {
      return 0;
    }
  },
};
