"use strict";
const { get, isEqual, isEmpty } = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  createTask: async (ctx) => {
    const missionData = ctx.request.body;
    const type = get(ctx, "request.body", "bounty");
    if (isEqual(type, "iat"))
      return await strapi.services.task.createInAppTrialTask(ctx, missionData);
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
    )
      return ctx.badRequest("Missing required fields");
    const apiKey = await strapi.services["api-key"].findOne({
      key: api_key,
      secret: secret_key,
      isActive: true,
    });
    const isApiKeyAuthorized = await strapi.services[
      "api-key"
    ].isApiKeyAuthorizedByObject(apiKey, request, taskCode);
    if (!isApiKeyAuthorized)
      return ctx.unauthorized(
        "The server understands the request but the API key is not authorized to access this resource"
      );

    const task = apiKey.tasks.find((task) => isEqual(task.code, taskCode));
    if (isEmpty(task))
      return ctx.unauthorized(
        "The server understands the request but the API key is not authorized to access this resource"
      );
    const hunter = await strapi.services.hunter.findOne({
      address: walletAddress,
    });
    const apply = await strapi.services.apply.findOne({
      hunter: hunter.id,
      task: task.id,
    });
  },
};
