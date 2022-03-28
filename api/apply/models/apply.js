"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is created
    async afterCreate(params, { task: taskId }) {
      await strapi.services.task.updateTaskTotalParticipantsById(taskId);
    },
  },
};
