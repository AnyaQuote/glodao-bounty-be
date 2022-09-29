"use strict";

module.exports = async (ctx, next) => {
  const { walletAddress, id, chain, solanaAddress } = ctx.request.body;
  const params = {
    id_ne: id,
  };
  if (chain === "bsc" || chain === "eth") params.address = walletAddress;
  else if (chain === "sol") params.solanaAddress = solanaAddress;

  const anotherHunterWithAddressCount = await strapi.services.hunter.count(
    params
  );

  if (anotherHunterWithAddressCount > 0)
    return ctx.badRequest("This wallet has been used by another user");

  return await next();
};
