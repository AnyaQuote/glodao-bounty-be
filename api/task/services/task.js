"use strict";

const { get, gte } = require("lodash");
const moment = require("moment");
const checkIsOwner = (ctx, ownerAddress) => {
  if (ctx.state.user.username !== ownerAddress)
    return ctx.forbidden(`You can not update this entry`);
};
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Increase a task total participants by an increment
 * @param {string} id task id
 * @param {number} increment number to increase
 * @returns updated task
 */
const increaseTaskTotalParticipantsById = async (id, increment) => {
  return await strapi.services.task.update(
    { id },
    {
      totalParticipants: task.totalParticipants + increment,
    }
  );
};

/**
 * Increase a task total participants by an increment
 * @param {task} task task need to be updated
 * @param {number} increment number to increase
 * @returns updated task
 */
const increaseTaskTotalParticipants = async (task, increment) => {
  return await strapi.services.task.update(
    { id: task.id },
    {
      totalParticipants: task.totalParticipants + increment,
    }
  );
};

/**
 * Update a task total participants
 * @param {string} id task id
 * @returns updated task
 */
const updateTaskTotalParticipantsById = async (id) => {
  const totalParticipants = await strapi.services.apply.count({
    task: id,
  });
  return await strapi.services.task.update(
    { id },
    {
      totalParticipants,
    }
  );
};

/**
 * Update a task completed participants
 * @param {string} id task id
 * @returns updated task
 */
const updateTaskCompletedParticipantsById = async (id) => {
  const completedParticipants = await strapi.services.apply.count({
    task: id,
    completeTime_null: false,
  });
  return await strapi.services.task.update(
    { id },
    {
      completedParticipants,
    }
  );
};

/**
 * Check if a task's priority pool with specific id is full
 * @param {string} taskId task id
 * @returns true if task's priority pool is full, else false
 */
const isPriorityPoolFullById = async (taskId) => {
  const task = await strapi.services.task.findOne({ id: taskId });
  const currentPriorityParticipants = await strapi.services.apply.count({
    task: task.id,
    poolType: "priority",
  });
  return gte(
    currentPriorityParticipants,
    get(task, "maxPriorityParticipants", 0)
  );
};

/**
 * Check if it is the right time to do the task
 * @param {task} task the task
 * @returns true - task is processable, otherwise false
 */
const isTaskProcessable = (task) => {
  if (!task) return false;
  return moment().isBetween(moment(task.startTime), moment(task.endTime));
};

/**
 * Check owner address and call create task services
 * @param {any} ctx
 * @param {task} missionData
 * @returns task
 */
const createTask = async (ctx, missionData) => {
  const {
    ownerAddress,
    poolId,
    name,
    type,
    status,
    tokenBasePrice,
    rewardAmount,
    startTime,
    endTime,
    maxParticipant,
    priorityRewardAmount,
    data,
    metadata,
  } = missionData;

  checkIsOwner(ctx, ownerAddress);

  const pool = await strapi.services["voting-pool"].findOne({
    id: poolId,
  });

  const numberOfCreatedMissions = await strapi.services.task.count({ poolId });

  if (numberOfCreatedMissions >= pool.totalMission) {
    ctx.forbidden("You cannot create this entry");
  }

  return await strapi.services.task.create({
    poolId,
    name,
    type,
    status,
    chainId: pool.chainId,
    tokenBasePrice,
    rewardAmount,
    startTime,
    endTime,
    maxParticipant,
    priorityRewardAmount,
    data,
    metadata,
  });
};

module.exports = {
  increaseTaskTotalParticipants,
  increaseTaskTotalParticipantsById,
  updateTaskTotalParticipantsById,
  isPriorityPoolFullById,
  isTaskProcessable,
  updateTaskCompletedParticipantsById,
  createTask,
};
