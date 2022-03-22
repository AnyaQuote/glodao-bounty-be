"use strict";
const { isEqual } = require("lodash");
const {
  isSolidityAddress,
  verifySoliditySignature,
} = require("../../../helpers/wallet-helper");

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
      return await strapi.services.hunter.updateHunterWalletAddress(
        hunter,
        walletAddress
      );

    return ctx.badRequest("Fail to verify sign message");
  },
};
