"use strict";

const {
  isValidStaker,
} = require("../../../helpers/blockchainHelpers/farm-helper");
const _ = require("lodash");
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
      const isPriorityFull = await strapi.services.task.isPriorityPoolFullById(
        task.id
      );
      const { user } = hunter;
      if (!isPriorityFull && (await isValidStaker(hunter.address, 1000)))
        event.poolType = "priority";
      else event.poolType = "community";

      let taskData = initEmptyStepData(task);
      const validatedTwitterTaskData = await preValidateFollowTwitterTask(
        _.get(taskData, "twitter", []),
        task,
        user
      );
      taskData.twitter = validatedTwitterTaskData;
      event.data = taskData;
      event.bounty = 0;
      event.referrerCode = hunter.referrerCode;
      event.campaignCode = hunter.campaignCode;
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

const preValidateFollowTwitterTask = async (emptyData, task, user) => {
  let twitterTaskData = emptyData;
  const type = "twitter";
  const mergedTwitterTask = _.merge(
    twitterTaskData.map((step) => {
      return {
        ...step,
        submitedLink: step.link,
      };
    }),
    _.get(task, ["data", type], [])
  );
  let flag = 0;
  for (let index = 0; index < mergedTwitterTask.length; index++) {
    const element = mergedTwitterTask[index];
    if (_.get(mergedTwitterTask[index + 1], "finished", false)) {
      flag = index;
      continue;
    }
    if (element.finished) {
      flag = index;
      continue;
    }
    if (element.type === "follow") {
      const followErrorMsg =
        await strapi.services.apply.validateFollowTwitterTask(element, user);
      if (followErrorMsg) break;
      twitterTaskData[index].finished = true;
      flag = index;
      continue;
    }
    break;
    if (flag < index - 1) break;
  }
  return twitterTaskData;
};
