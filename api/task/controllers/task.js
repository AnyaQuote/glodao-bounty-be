"use strict";
const { get, isEqual, isEmpty } = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const partnerDeleteTask = async (ctx) => {
  const { id, partnerPlatform } = ctx.params;
  const task = await strapi.services.task.findOne({ id });
  if (!task) return ctx.badRequest("Invalid ID");
  if (task.realPlatform == partnerPlatform) {
    return await strapi.services.task.delete({ id });
  }
  return ctx.forbidden("You are not authorized to access this resource");
};

const createIndividualSocialTask = (ctx) => {
  return strapi.services.task.createIndividualSocialTask(ctx);
};

module.exports = {
  exportUsers: async (ctx) => {
    const { id, type } = get(ctx, "query", {});
    if (isEmpty(id))
      return ctx.badRequest("Missing required field: id is required");
    if (isEmpty(type) || isEqual(type, "user"))
      return await strapi.services.task.exportTaskHuntersWithoutReward(ctx, id);
    if (isEqual(type, "rewards"))
      return await strapi.services.task.exportTaskRewards(ctx, id);
    return "Not implemented";
  },
  mapUniqueId: async (ctx) => {
    const hunterId = get(ctx, "state.user.hunter", "");
    const { taskId, uniqueId } = get(ctx, "request.body", {});
    if (isEmpty(hunterId) || isEmpty(taskId) || isEmpty(uniqueId)) {
      return ctx.badRequest("Missing required fields");
    }
    return await strapi.services.task.mapHunterWithTaskProcessRecord(
      taskId,
      uniqueId,
      hunterId
    );
  },
  verifyTelegramLink: async (ctx) => {
    const link =
      get(ctx, "query.link", "") ||
      get(ctx, "request.body.link", "") ||
      get(ctx, "params.link", "");
    const isValid = await strapi.services.task.verifyTelegramMissionLink(
      link,
      ctx
    );
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
    if (isEqual(type, "iat") || isEqual(type, "mix")) {
      return await strapi.services.task.createInAppTrialTask(ctx, missionData);
    } else {
      return await strapi.services.task.createTask(ctx, missionData);
    }
  },
  updateTask: async (ctx) => {
    const missionData = ctx.request.body;
    const type = get(ctx, "request.body.type", "bounty");
    if (isEqual(type, "iat")) {
      return await strapi.services.task.updateBaseTaskIat(ctx, missionData);
    } else {
      return await strapi.services.task.updateTask(ctx, missionData);
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
    const { taskCode, walletAddress, stepCode, uniqueId } = get(
      request,
      "body",
      {}
    );
    if (
      isEmpty(api_key) ||
      isEmpty(secret_key) ||
      isEmpty(taskCode) ||
      isEmpty(stepCode)
    ) {
      return ctx.badRequest("Missing required fields");
    }
    if (isEmpty(uniqueId) && isEmpty(walletAddress)) {
      return ctx.badRequest("uniqueId or walletAddress must be provided");
    }
    if (!isEmpty(uniqueId))
      return await strapi.services.task.updateInApTrialTaskWithUniqueId(
        ctx,
        request,
        {
          api_key,
          secret_key,
          taskCode,
          stepCode,
          uniqueId,
        }
      );

    return await strapi.services.task.updateInAppTrialTask(ctx, request, {
      api_key,
      secret_key,
      taskCode,
      walletAddress,
      stepCode,
    });
  },
  partnerDeleteTask,
  createIndividualSocialTask,
};
