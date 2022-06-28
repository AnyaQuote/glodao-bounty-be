"use strict";

module.exports = async (ctx, next) => {
  const { walletAddress, id } = ctx.request.body;

  const count = await strapi.services["project-owner"].count({
    id_ne: id,
    address: walletAddress,
  });

  if (count > 0)
    return ctx.badRequest("This wallet has been used by another user");

  return await next();
};
