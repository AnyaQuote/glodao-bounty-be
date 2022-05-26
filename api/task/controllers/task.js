"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  createTask: async (ctx) => {
    const missionData = ctx.request.body;
    return await strapi.services.task.createTask(ctx, missionData);
  },
};
