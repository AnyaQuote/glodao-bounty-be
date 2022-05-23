"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  updateVotingPoolInfo: async (ctx) => {
    return await strapi.services["voting-pool"].updateVotingPoolInfo(
      ctx.request.body
    );
  },
  createOrUpdateVotingPool: async (ctx) => {
    const votingPoolData = ctx.request.body;
    if (!votingPoolData.poolId || !votingPoolData.ownerAddress)
      return ctx.badRequest("Invalid project Id or owner address");

    return await strapi.services["voting-pool"].createOrUpdateVotingPool(
      ctx,
      votingPoolData
    );
  },
  updateStatusVotingPool: async (ctx) => {
    return await strapi.services["voting-pool"].updateStatusVotingPool(
      ctx.request.body
    );
  },
  cancelVotingPool: async (ctx) => {
    return await strapi.services["voting-pool"].cancelVotingPool(
      ctx.request.body
    );
  },
};
