"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is created
    async beforeCreate(event) {
      const task = await strapi.services.task.findOne({ id: event.task });
      event.status = "processing";
      event.ID = `${event.hunter}_${event.task}`;
      event.poolType = "community";
      event.data = initEmptyStepData(task);
      delete event.bounty;
      delete event.rejectedReason;
      delete event.metadata;
      delete event.walletAddress;
    },
    // Called after an entry is created
    async afterCreate(params, { task: taskId }) {
      await strapi.services.task.updateTaskTotalParticipantsById(taskId);
    },
  },
};

const initEmptyStepData = (task) => {
  const tempStepData = {};
  for (const key in task.data) {
    if (Object.prototype.hasOwnProperty.call(task.data, key)) {
      const seperateTaskData = task.data[key];
      tempStepData[key] = seperateTaskData.map((miniTask) => {
        return { type: miniTask.type, link: "", finished: false };
      });
    }
  }
  return tempStepData;
};
