"use strict";
const { get, isEqual, isEmpty } = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  verifyTelegramLink: async (ctx) => {
    const link =
      _.get(ctx, "query.id", "") ||
      _.get(ctx, "request.body.id", "") ||
      _.get(ctx, "params.id", "");
    const isValid = await strapi.services.task.verifyTelegramMissionLink(link);
    if (!isValid) {
      return ctx.badRequest("Invalid link or the bot is not in the chat yet");
    }
    return {
      status: true,
      code: 200,
    };
  },
  createTask: async (ctx) => {
    const missionData = ctx.request.body;
    const type = get(ctx, "request.body.type", "bounty");
    if (isEqual(type, "iat")) {
      return await strapi.services.task.createInAppTrialTask(ctx, missionData);
    } else {
      return await strapi.services.task.createTask(ctx, missionData);
    }
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
  updateInAppTrial: async (ctx) => {
    // get route from ctx
    const request = get(ctx, "request", {});
    const { api_key, secret_key } = get(request, "query", {});
    const { taskCode, walletAddress, stepCode } = get(request, "body", {});
    if (
      isEmpty(api_key) ||
      isEmpty(secret_key) ||
      isEmpty(taskCode) ||
      isEmpty(walletAddress) ||
      isEmpty(stepCode)
    ) {
      return ctx.badRequest("Missing required fields");
    }
    return await strapi.services.task.updateInAppTrialTask(ctx, request, {
      api_key,
      secret_key,
      taskCode,
      walletAddress,
      stepCode,
    });
  },
};
