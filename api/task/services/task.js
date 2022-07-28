"use strict";

const { get, gte, isEmpty, isEqual } = require("lodash");
const moment = require("moment");
const { FixedNumber } = require("@ethersproject/bignumber");
const {
  isUserFollowChat,
  getChatFromLink,
} = require("../../../helpers/telegram-bot-helpers");
const fxZero = FixedNumber.from("0");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Check if telegram link is valid and bot in the chat
 * @param {string} link telegram link
 * @returns true - link is valid and bot in the chat, otherwise false
 */
const verifyTelegramMissionLink = async (link) => {
  try {
    const BOT_ID = process.env.TELEGRAM_BOT_ID;
    console.log(link);
    console.log(getChatFromLink(link));
    console.log(BOT_ID);
    const isBotInLink = await isUserFollowChat(getChatFromLink(link), BOT_ID);
    console.log(isBotInLink);
    if (isBotInLink) return true;
    else return false;
  } catch (error) {
    console.log(error, "verify telegram mission link error bot");
    return false;
  }
};

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
    moment(endTime).isAfter(moment(pool.endDate)) ||
    moment(startTime).isAfter(moment(endTime))
  ) {
    ctx.badRequest(INVALID_DATE_RANGE);
  }

  const numberOfCreatedMissions = await strapi.services.task.count({ poolId });

  if (numberOfCreatedMissions >= pool.totalMission) {
    ctx.forbidden(EXCEEDED_MISSION_LIMIT);
  }

  return await strapi.services.task.create({
    votingPool: pool.id,
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

  // Return zero if there is no applies to calculate
  if (nonNullApplies.length === 0) return fxZero._value;

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

const createInAppTrialTask = async (ctx, missionData) => {
  const {
    projectOwner,
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
    optionalTokens,
  } = missionData;

  const votingPool = await strapi.services["voting-pool"].findOne({
    id: poolId,
  });

  if (isEmpty(votingPool)) {
    ctx.badRequest(POOL_NOT_FOUND);
  }

  if (
    moment(startTime).isBefore(moment(votingPool.startDate)) ||
    moment(endTime).isAfter(moment(votingPool.endDate)) ||
    moment(startTime).isAfter(moment(endTime))
  ) {
    ctx.badRequest(INVALID_DATE_RANGE);
  }

  const numberOfCreatedMissions = await strapi.services.task.count({
    votingPool: votingPool.id,
  });

  if (numberOfCreatedMissions >= votingPool.totalMission) {
    ctx.forbidden(EXCEEDED_MISSION_LIMIT);
  }

  const task = await strapi.services.task.create({
    votingPool: votingPool.id,
    poolId,
    name,
    type,
    status,
    chainId: votingPool.chainId,
    tokenBasePrice,
    rewardAmount,
    startTime,
    endTime,
    maxParticipants,
    priorityRewardAmount,
    maxPriorityParticipants,
    data,
    metadata,
    optionalTokens,
  });
  const apiKey = await strapi.services[
    "api-key"
  ].updateApiKeyTaskListByProjectOwner(projectOwner, [task.id]);
  return {
    ...task,
    api_key: apiKey.key,
    secret_key: apiKey.secret,
    tasks: apiKey.tasks,
  };
};

const APP_TRIAL_TYPE = "iat";
const unauthorizedError = (ctx, message) => ctx.unauthorized(message);
const requestError = (code, message) => ({
  status: false,
  code,
  error: message,
});
const successResponse = (code, data) => ({
  status: true,
  code,
  data,
});

/**
 * Update app trial task step data finished status to true
 * @param {*} ctx
 * @param {*} request
 * @param {*} data {api_key, secret_key, taskCode, stepCode, walletAddress}
 * @returns successReponse
 */
const updateInAppTrialTask = async (ctx, request, data) => {
  const { api_key, secret_key, taskCode, walletAddress, stepCode } = data;
  const apiKey = await strapi.services["api-key"].findOne({
    key: api_key,
    secret: secret_key,
    isActive: true,
  });

  // Test api key is authorized
  const isApiKeyAuthorized = await strapi.services[
    "api-key"
  ].isApiKeyAuthorizedByObject(apiKey, request, taskCode);
  if (!isApiKeyAuthorized) {
    return unauthorizedError(
      ctx,
      "The server understands the request but the API key is not authorized to access this resource"
    );
  }

  // Test in authorized api key contains requested task code
  const keyTask = apiKey.tasks.find((task) => isEqual(task.code, taskCode));
  if (isEmpty(keyTask)) {
    return unauthorizedError(
      ctx,
      "The server understands the request but the API key is not authorized to access this resource"
    );
  }

  // Test hunter wallet address matched with requested wallet address
  const hunter = await strapi.services.hunter.findOne({
    address: walletAddress,
  });
  if (isEmpty(hunter)) {
    return requestError(404, "Hunter not found");
  }

  // Test there is task existed with requested keyTask
  const task = await strapi.services.task.findOne({ id: keyTask.id });
  if (isEmpty(task)) {
    return requestError(404, "Task not found");
  }

  let apply;
  // Get existed apply with hunter and task above
  apply = await strapi.services.apply.findOne({
    hunter: hunter.id,
    task: task.id,
  });
  // If task not exists, create new apply with the supplied hunter and task above
  if (isEmpty(apply)) {
    const newApply = await strapi.services.apply.create({
      hunter: hunter.id,
      task: task.id,
      ID: `${task.id}_${hunter.id}`,
    });
    apply = newApply;
  }

  const appTrialDataWithUpdatedStep = apply.data[APP_TRIAL_TYPE].map(
    (step, index) => {
      const currentReferStepCode = task.data[APP_TRIAL_TYPE][index].code;
      if (currentReferStepCode === stepCode) {
        return { ...step, finished: true };
      } else return step;
    }
  );
  const updatedData = { [APP_TRIAL_TYPE]: appTrialDataWithUpdatedStep };
  // Sync updated apply data with database
  const res = await strapi.services.apply.update(
    { id: apply.id },
    { data: updatedData }
  );

  console.log(res);

  return successResponse(200, {
    walletAddress,
    task: taskCode,
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
  calculateAverageCommunityReward,
  createInAppTrialTask,
  updateInAppTrialTask,
  verifyTelegramMissionLink,
};
