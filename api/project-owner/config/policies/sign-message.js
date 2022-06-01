"use strict";

const _ = require("lodash");
const {
  isSolidityAddress,
  verifySoliditySignature,
} = require("../../../../helpers/wallet-helper");

module.exports = async (ctx, next) => {
  const { walletAddress, signature, id, chain } = ctx.request.body;

  if (!walletAddress || !signature || !id || !chain)
    return ctx.badRequest(
      "Invalid request body: missing fields for sign message verification"
    );

  if (!_.isEqual(chain, "sol") && !isSolidityAddress(walletAddress))
    return ctx.badRequest(
      "Invalid wallet address: wallet address is not ETH chain"
    );

  const projectOwner = await strapi.services["project-owner"].findOne({
    id,
  });

  if (
    await verifySoliditySignature(walletAddress, signature, projectOwner.nonce)
  ) {
    await strapi.services["project-owner"].updateNonce(projectOwner);
    return await next();
  }

  return ctx.badRequest("Fail to verify sign message");
};
