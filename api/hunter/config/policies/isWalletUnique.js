"use strict";

module.exports = async (ctx, next) => {
  const { walletAddress, id } = ctx.request.body;

  const anotherHunterWithAddressCount = await strapi.services.hunter.count({
    id_ne: id,
    address: walletAddress,
  });

  if (anotherHunterWithAddressCount > 0)
    return ctx.badRequest("This wallet has been used by another user");

  return await next();
};
