"use strict";

module.exports = async (ctx, next) => {
  const { walletAddress, id, chain, solanaAddress } = ctx.request.body;
  const params = {
    id_ne: id,
  };
  if (chain === "sol") {
    if (!solanaAddress) return ctx.badRequest("Missing solana wallet");
    params.solanaAddress = solanaAddress;
  } else params.address = walletAddress;

  const anotherHunterWithAddressCount = await strapi.services.hunter.count(
    params
  );

  if (anotherHunterWithAddressCount > 0)
    return ctx.badRequest("This wallet has been used by another user");

  return await next();
};
