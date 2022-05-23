"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  createOrUpdateVotingPool: async (ctx) => {
    const votingPoolData = ctx.request.body;
    if (!votingPoolData.poolId || !votingPoolData.ownerAddress)
      return ctx.badRequest("Invalid project Id or owner address");

    return await strapi.services["voting-pool"].createOrUpdateVotingPool(
      ctx,
      votingPoolData
    );
  },
};
