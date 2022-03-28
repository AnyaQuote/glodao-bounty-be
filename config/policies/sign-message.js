"use strict";

const _ = require("lodash");
const {
  isSolidityAddress,
  verifySoliditySignature,
} = require("../../helpers/wallet-helper");

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

  const hunter = await strapi.services.hunter.findOne({
    id: id,
  });

  if (await verifySoliditySignature(walletAddress, signature, hunter.nonce))
    return await next();

  return ctx.badRequest("Fail to verify sign message");
};
