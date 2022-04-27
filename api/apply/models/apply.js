"use strict";

const {
  isValidStaker,
} = require("../../../helpers/blockchainHelpers/farm-helper");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is created
    async beforeCreate(event) {
      const task = await strapi.services.task.findOne({ id: event.task });
      if (!strapi.services.task.isTaskProcessable(task))
        throw strapi.errors.conflict(
          "Now is not the right time to do this task"
        );
      event.status = "processing";
      event.ID = `${event.hunter}_${event.task}`;

      const hunter = await strapi.services.hunter.findOne({ id: event.hunter });
      if (await isValidStaker(hunter.address, 1000))
        event.poolType = "priority";
      else event.poolType = "community";

      event.data = initEmptyStepData(task);
      event.bounty = 0;
      event.referrerCode = hunter.referrerCode;
      delete event.rejectedReason;
      delete event.metadata;
      delete event.walletAddress;
    },
    // Called after an entry is created
    async afterCreate(params, { task: taskId, hunter: hunterId }) {
      await strapi.services.task.updateTaskTotalParticipantsById(taskId);
      await strapi.services.hunter.updateHunterStatusToNewbie(hunterId);
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
