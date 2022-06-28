"use strict";

const { get, gte, isEmpty } = require("lodash");
const moment = require("moment");
const { FixedNumber } = require("@ethersproject/bignumber");
const fxZero = FixedNumber.from("0");
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
      totalParticipants: Math.floor(totalParticipants * 1.1),
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

const POOL_NOT_FOUND = "Could not find pool to create this mission";
const INVALID_DATE_RANGE = "Invalid mission start and end date";
const EXCEEDED_MISSION_LIMIT = "You have reached missions limit";

/**
 * Create task services
 * @param {any} ctx
 * @param {task} missionData
 * @returns task
 */
const createTask = async (ctx, missionData) => {
  const {
    poolId,
    name,
    type,
    status,
    tokenBasePrice,
    rewardAmount,
    startTime,
    endTime,
    maxParticipants,
    maxPriorityParticipants,
    priorityRewardAmount,
    data,
    metadata,
  } = missionData;

  const pool = await strapi.services["voting-pool"].findOne({
    id: poolId,
  });

  if (isEmpty(pool)) {
    ctx.badRequest(POOL_NOT_FOUND);
  }

  if (
    moment(startTime).isBefore(moment(pool.startDate)) ||
    moment(endTime).isAfter(moment(pool.endDate))
  ) {
    ctx.badRequest(INVALID_DATE_RANGE);
  }

  const numberOfCreatedMissions = await strapi.services.task.count({ poolId });

  if (numberOfCreatedMissions >= pool.totalMission) {
    ctx.forbidden(EXCEEDED_MISSION_LIMIT);
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
    maxParticipants,
    priorityRewardAmount,
    maxPriorityParticipants,
    data,
    metadata,
  });
};

/**
 * Convert token to base price and sum converted value
 * @param {array} optionalTokenReward array of token
 * @returns sum of converted value
 */
const calculateOptionTokenTotalValue = (optionalTokenReward) => {
  const totalValue = optionalTokenReward.reduce((acc, token) => {
    const fxTokenBounty = FixedNumber.from(`${token.bounty}`);
    const fxTokenBasePrice = FixedNumber.from(`${token.tokenBasePrice}`);
    const fxConvertedValue = fxTokenBasePrice.mulUnsafe(fxTokenBounty);
    return acc.addUnsafe(fxConvertedValue);
  }, fxZero);
  return totalValue;
};

/**
 * Calculate average community reward from tasks and applies
 * @param {number} limit number of task/mission to get
 * @param {string} type type of task/mission, default is 'bounty'
 * @param {string} sort sort order, default will sort by tasks's end time in descending order
 * @param {boolean} isEnded should only get task that has ended or not, default is true
 * @returns average community reward
 */
const calculateAverageCommunityReward = async (
  limit,
  type = "bounty",
  sort = "endTime:DESC",
  isEnded = true
) => {
  // Get lastest bounty missions/tasks based on limit amount
  const tasks = await strapi.services.task.find({
    type,
    _limit: limit,
    _sort: sort,
    endTime_lte: isEnded ? moment().toISOString() : undefined,
  });

  // Get all applies with status of 'awarded' and poolType 'community' from tasks
  const applies = await Promise.all(
    tasks.map((task) => {
      return strapi.services.apply.findOne({
        task: task.id,
        status: "awarded",
        poolType: "community",
      });
    })
  );

  // Filter null result in applies
  const nonNullApplies = applies.filter((x) => x);

  const fxNumOfApplies = FixedNumber.from(`${nonNullApplies.length}`);

  // Get sum of reward value from applies
  const sum = nonNullApplies.reduce((accumlator, apply) => {
    const optionalTokenTotalValue = calculateOptionTokenTotalValue(
      get(apply, "optionalTokenReward", [])
    );
    const fxApplyBounty = FixedNumber.from(`${apply.bounty}`);
    return accumlator
      .addUnsafe(optionalTokenTotalValue)
      .addUnsafe(fxApplyBounty);
  }, fxZero);

  // Div to get average reward value
  const averageValue = sum.divUnsafe(fxNumOfApplies)._value;

  return averageValue;
};

module.exports = {
  increaseTaskTotalParticipants,
  increaseTaskTotalParticipantsById,
  updateTaskTotalParticipantsById,
  isPriorityPoolFullById,
  isTaskProcessable,
  updateTaskCompletedParticipantsById,
  createTask,
  calculateAverageCommunityReward,
};
