"use strict";
const { get } = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  createTask: async (ctx) => {
    const missionData = ctx.request.body;
    return await strapi.services.task.createTask(ctx, missionData);
  },
  getAverageCommunityReward: async (ctx) => {
    try {
      const limit =
        get(ctx, "query.limit", "") ||
        get(ctx, "request.body.limit", "") ||
        get(ctx, "params.limit", "");
      const average =
        await strapi.services.task.calculateAverageCommunityReward(limit);
      return {
        status: true,
        code: 200,
        data: {
          result: average,
        },
      };
    } catch (error) {
      return {
        status: false,
        code: 500,
        error: error,
      };
    }
  },
};
