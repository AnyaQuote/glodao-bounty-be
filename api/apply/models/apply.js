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

      const platform = event.platform;
      if (_.isEmpty(platform)) {
        event.platform = task.platform;
        event.isCreatedOnTaskPlatform = true;
      } else {
        event.isCreatedOnTaskPlatform = _.isEqual(platform, task.platform);
      }
      event.status = "processing";
      event.ID = `${event.hunter}_${event.task}`;

      const hunter = await strapi.services.hunter.findOne({ id: event.hunter });
      // const isPriorityFull = await strapi.services.task.isPriorityPoolFullById(
      //   task.id
      // );
      const { user } = hunter;
      // if (!isPriorityFull && (await isValidStaker(hunter.address, 1000)))
      // if (!isPriorityFull) event.poolType = "priority";
      // else
      // event.poolType = "community";

      let taskData = initEmptyStepData(task);
      if (!_.isEmpty(_.get(taskData, "twitter", []))) {
        const validatedTwitterTaskData = await preValidateFollowTwitterTask(
          _.get(taskData, "twitter", []),
          task,
          user
        );
        taskData.twitter = validatedTwitterTaskData;
      }
      event.data = taskData;
      event.bounty = 0;
      event.referrerCode = hunter.referrerCode;
      event.campaignCode = hunter.campaignCode;
      delete event.rejectedReason;
      delete event.metadata;
      delete event.walletAddress;
    },
    // Called after an entry is created
    async afterCreate(
      params,
      { task: taskId, hunter: hunterId, poolType, id, independentReferrerCode }
    ) {
      await strapi.services.task.updateTaskTotalParticipantsById(taskId);
      await strapi.services.task.updateTaskCompletedParticipantsById(taskId);
      await strapi.services.task.updateTaskParticipantFromTwitter(
        taskId,
        hunterId
      );
      await strapi.services.hunter.updateHunterStatusToNewbie(hunterId);
      if (
        !_.isNil(independentReferrerCode) &&
        !_.isEmpty(independentReferrerCode)
      )
        await strapi.services.hunter.updateHunterReferrerThroughMission(
          hunterId,
          independentReferrerCode
        );
      // const isPriorityFull = await strapi.services.task.isPriorityPoolFullById(
      //   taskId
      // );
      // if (isPriorityFull && poolType === "priority") {
      //   await strapi.services.apply.update(
      //     { id: id },
      //     { poolType: "community" }
      //   );
      // }
    },

    async afterUpdate(params, event) {
      const taskId = _.get(params, "task.id", "");
      const bountyStatus = _.get(params, "status");
      if (taskId && bountyStatus === "completed") {
        await strapi.services.task.updateTaskCompletedParticipantsById(taskId);
        await strapi.services.hunter.updateHunterTaskUniqueId(
          _.get(params, "hunter", {}),
          _.get(params, "task.metadata.uniqueSubTypeId", "")
        );
      }
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
