"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  createOrUpdateVotingPool: async (ctx) => {
    const votingPoolData = ctx.request.body;
    if (!votingPoolData.poolId) return ctx.badRequest("Invalid project Id");
    return await strapi.services["voting-pool"].createOrUpdateVotingPool(
      ctx,
      votingPoolData
    );
  },
  updateStatusToApproved: async (ctx) => {
    return await strapi.services["voting-pool"].updateStatusToApproved(
      ctx.request.body
    );
  },
  cancelVotingPool: async (ctx) => {
    const votingPoolData = ctx.request.body;
    return await strapi.services["voting-pool"].cancelVotingPool(
      votingPoolData
    );
  },
  updateVotingPoolInfo: async (ctx) => {
    const votingPoolData = ctx.request.body;
    return await strapi.services["voting-pool"].updateVotingPoolInfo(
      votingPoolData
    );
  },
  updateTokenBVotingPool: async (ctx) => {
    const votingPoolData = ctx.request.body;
    return await strapi.services["voting-pool"].updateTokenBVotingPool(
      votingPoolData
    );
  },
};
