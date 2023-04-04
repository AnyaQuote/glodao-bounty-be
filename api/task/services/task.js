"use strict";

const {
  get,
  gte,
  isEmpty,
  isEqual,
  includes,
  uniq,
  isNil,
  pick,
  kebabCase,
  size,
  merge,
  toNumber,
  omit,
} = require("lodash");
const moment = require("moment");
const { FixedNumber } = require("@ethersproject/bignumber");
const {
  isUserFollowChat,
  getChatFromLink,
  getBotIdUsingPlatform,
} = require("../../../helpers/telegram-bot-helpers");
const { getTaskRewards } = require("../../../helpers/task-helper");
const { getTweetData } = require("../../../helpers/twitter-helper-v1");
const { getTweetIdFromLink } = require("../../../helpers/twitter-helper");
const { getPlatformFromContext } = require("../../../helpers/origin-helper");
const fxZero = FixedNumber.from("0");
const joi = require("joi");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

//TODO: Remove this fake function
const updateTaskParticipantFromTwitter = async (taskId, hunterId) => {
  const task = await strapi.services.task.findOne({ id: taskId });
  console.log(taskId);
  if (task.name !== "GloDAO" && task.name !== "Galaxy Finance") {
    await strapi.services.task.updateTaskTotalParticipantsById(taskId);
    await strapi.services.task.updateTaskCompletedParticipantsById(taskId);
    return;
  }
  try {
    const hunter = await strapi.services.hunter.findOne({ id: hunterId });
    const accessToken = get(
      hunter,
      "user.accessToken",
      "1504294069195149318-nMFOwoRUXGK39KoKNFtig1QfT8DKJB"
    );
    const accessTokenSecret = get(
      hunter,
      "user.accessTokenSecret",
      "CO0dPi4gyfmLEGOOVGnwhe1oBRSCOGXClSPMCHjuYEdbi"
    );
    const platform = get(hunter, "user.platform", "gld");
    const link = task.data["twitter"][1].link;
    const statusId = getTweetIdFromLink(link);
    const res = await getTweetData(
      statusId,
      accessToken,
      accessTokenSecret,
      platform
    );
    const newCompleted =
      task.completedParticipants > res.favorite_count
        ? task.completedParticipants
        : res.favorite_count;
    // const newTotal = Math.floor(newCompleted * 1.1);
    const newTotal = newCompleted;
    return await strapi.services.task.update(
      { id: task.id },
      {
        completedParticipants: newCompleted,
        totalParticipants: newTotal,
      }
    );
  } catch (error) {
    console.log(error, "update task participant from twitter error");
    console.log(error[1], "update task participant from twitter error");
    console.log(
      JSON.stringify(error),
      "update task participant from twitter error"
    );
  }
};

/**
 * Get array of users who have applied for a task with id
 * @param {object} ctx context object
 * @param {string} id task id
 * @returns array of users who applied for the task
 */
const exportTaskHuntersWithoutReward = async (ctx, id) => {
  let task = null;
  try {
    task = await strapi.services.task.findOne({ id });
  } catch (error) {
    return ctx.badRequest("Task not found");
  }
  const applies = await strapi.services.apply.getAllTaskRelatedApplies(id);
  return applies.map((apply) => ({
    twitter: apply.hunter.name,
    wallet: get(apply, "hunter.address", ""),
    status: apply.status,
    completeTime: get(apply, "completeTime", null),
  }));
};

const exportTaskRewards = async (ctx, id) => {
  let task = null;
  try {
    task = await strapi.services.task.findOne({ id });
  } catch (error) {
    return ctx.badRequest("Task not found");
  }
  const applies = await strapi.services.apply.getAllTaskRelatedApplies(id);
  const rewardAddressMap = getTaskRewards(
    task,
    applies.filter((apply) => apply.status !== "processing")
  );

  const result = [];
  for (const [key, value] of rewardAddressMap) {
    result.push({
      walletAddress: key,
      rewardAmount: `${value._value}`.substring(0, 8),
    });
  }
  return result;
};

/**
 * Check if telegram link is valid and bot in the chat
 * @param {string} link telegram link
 * @returns true - link is valid and bot in the chat, otherwise false
 */
const verifyTelegramMissionLink = async (link, ctx) => {
  try {
    // const BOT_ID = process.env.TELEGRAM_BOT_ID;
    const BOT_ID = getBotIdUsingPlatform(getPlatformFromContext(ctx));
    console.log(link, "link");
    console.log(getChatFromLink(link), "get chat from link");
    console.log(BOT_ID, "botid");
    const isBotInLink = await isUserFollowChat(
      getChatFromLink(link),
      BOT_ID,
      getPlatformFromContext(ctx)
    );
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
      // totalParticipants: Math.floor(totalParticipants * 1.1),
      totalParticipants: totalParticipants,
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
    priorityRatio,
  } = missionData;

  const pool = await strapi.services["voting-pool"].findOne({
    id: poolId,
  });

  const platform = getPlatformFromContext(ctx);
  if (isEmpty(platform) || isEqual(platform, "unknown")) {
    return ctx.badRequest("Platform is not supported");
  }

  if (isEmpty(pool)) {
    return ctx.badRequest(POOL_NOT_FOUND);
  }

  if (
    moment(startTime).isBefore(moment(pool.startDate)) ||
    moment(endTime).isAfter(moment(pool.endDate)) ||
    moment(startTime).isAfter(moment(endTime))
  ) {
    return ctx.badRequest(INVALID_DATE_RANGE);
  }

  const numberOfCreatedMissions = await strapi.services.task.count({ poolId });

  if (numberOfCreatedMissions >= pool.totalMission) {
    return ctx.forbidden(EXCEEDED_MISSION_LIMIT);
  }

  if (pool.usedMission >= pool.totalMission) {
    return ctx.forbidden(EXCEEDED_MISSION_LIMIT);
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
    platform,
    priorityRatio,
  });
};

const updateTask = async (ctx, missionData) => {
  const {
    id,
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
    priorityRatio,
    transactions,
  } = missionData;

  // const task = await strapi.services.task.findOne({
  //   id: id,
  // });

  // const pool = task.votingPool;

  const pool = await strapi.services["voting-pool"].findOne({
    id: poolId,
  });

  if (isEmpty(pool)) {
    return ctx.badRequest(POOL_NOT_FOUND);
  }

  if (
    moment(startTime).isBefore(moment(pool.startDate)) ||
    moment(endTime).isAfter(moment(pool.endDate)) ||
    moment(startTime).isAfter(moment(endTime))
  ) {
    return ctx.badRequest(INVALID_DATE_RANGE);
  }

  if (transactions) {
    return await strapi.services.task.update(
      { id },
      {
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
        priorityRatio,
        transactions,
      }
    );
  } else
    return await strapi.services.task.update(
      { id },
      {
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
        priorityRatio,
      }
    );
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

  const platform = getPlatformFromContext(ctx);
  if (isEmpty(platform) || isEqual(platform, "unknown")) {
    return ctx.badRequest("Platform is not supported");
  }

  const votingPool = await strapi.services["voting-pool"].findOne({
    id: poolId,
  });

  if (isEmpty(votingPool)) {
    return ctx.badRequest(POOL_NOT_FOUND);
  }

  if (
    moment(startTime).isBefore(moment(votingPool.startDate)) ||
    moment(endTime).isAfter(moment(votingPool.endDate)) ||
    moment(startTime).isAfter(moment(endTime))
  ) {
    return ctx.badRequest(INVALID_DATE_RANGE);
  }

  if (!projectOwner) return ctx.badRequest("Missing project owner");

  const numberOfCreatedMissions = await strapi.services.task.count({ poolId });

  if (numberOfCreatedMissions >= votingPool.totalMission) {
    return ctx.forbidden(EXCEEDED_MISSION_LIMIT);
  }

  if (votingPool.usedMission >= votingPool.totalMission) {
    return ctx.forbidden(EXCEEDED_MISSION_LIMIT);
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
    platform,
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

const updateBaseTaskIat = async (ctx, missionData) => {
  const {
    id,
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
    transactions,
  } = missionData;

  // const task = await strapi.services.task.findOne({
  //   id: id,
  // });

  // const votingPool = task.votingPool;

  const votingPool = await strapi.services["voting-pool"].findOne({
    id: poolId,
  });

  if (isEmpty(votingPool)) {
    return ctx.badRequest(POOL_NOT_FOUND);
  }

  if (
    moment(startTime).isBefore(moment(votingPool.startDate)) ||
    moment(endTime).isAfter(moment(votingPool.endDate)) ||
    moment(startTime).isAfter(moment(endTime))
  ) {
    return ctx.badRequest(INVALID_DATE_RANGE);
  }
  if (transactions) {
    return await strapi.services.task.update(
      { id },
      {
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
        transactions,
      }
    );
  } else
    return await strapi.services.task.update(
      { id },
      {
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
      }
    );
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

const mapHunterWithTaskProcessRecord = async (taskId, uniqueId, hunterId) => {
  const processRecord = await strapi.services["pending-app-process"].findOne({
    task: taskId,
    uniqueId,
  });
  if (isEmpty(processRecord)) {
    const newRecord = await strapi.services["pending-app-process"].create({
      uniqueId,
      task: taskId,
      hunter: hunterId,
      data: [],
    });
    let apply;
    // Get existed apply with hunter and task above
    apply = await strapi.services.apply.findOne({
      hunter: hunterId,
      task: taskId,
    });
    const task = get(newRecord, "task", {});

    let existedUniqueId = get(apply, "metadata.uniqueId", "");
    // If task not exists, create new apply with the supplied hunter and task above
    if (isEmpty(apply)) {
      const newApply = await strapi.services.apply.create({
        hunter: hunter.id,
        task: task.id,
        ID: `${task.id}_${hunter.id}`,
      });
      apply = newApply;
    }
    // Sync updated apply data with database
    const res = await strapi.services.apply.update(
      { id: apply.id },
      {
        metadata: {
          uniqueId: isEmpty(existedUniqueId) ? uniqueId : existedUniqueId,
        },
      }
    );

    return successResponse(200, {
      uniqueId,
      apply: res,
    });
  }

  let hunter = get(processRecord, "hunter", {});
  if (!isEmpty(hunter) && hunter.id !== hunterId) {
    return requestError(
      409,
      "This unique id is already used by another hunter"
    );
  }

  if (!isEmpty(hunter)) {
    return successResponse(200, {
      uniqueId,
      hunterId,
    });
  }
  hunter = await strapi.services.hunter.findOne({ id: hunterId });
  await strapi.services["pending-app-process"].update(
    { id: processRecord.id },
    {
      hunter: hunterId,
      walletAddress: get(hunter, "address", ""),
    }
  );

  const task = get(processRecord, "task", {});
  if (isEmpty(task)) {
    return requestError(500, "Internal server error");
  }

  let apply;
  // Get existed apply with hunter and task above
  apply = await strapi.services.apply.findOne({
    hunter: hunterId,
    task: taskId,
  });
  let existedUniqueId = get(apply, "metadata.uniqueId", "");
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
      if (includes(processRecord.data, currentReferStepCode)) {
        return { ...step, finished: true };
      } else return step;
    }
  );
  const updatedData = {
    ...apply.data,
    [APP_TRIAL_TYPE]: appTrialDataWithUpdatedStep,
  };
  var isTaskCompleted = true;
  for (const key in updatedData) {
    if (Object.hasOwnProperty.call(updatedData, key)) {
      const element = updatedData[key];
      if (element.every((step) => step.finished)) {
        continue;
      } else {
        isTaskCompleted = false;
        break;
      }
    }
  }

  if (isEmpty(get(hunter, "address", ""))) {
    isTaskCompleted = false;
  }
  // Sync updated apply data with database
  const res = await strapi.services.apply.update(
    { id: apply.id },
    {
      data: updatedData,
      completeTime: isTaskCompleted ? moment().toISOString() : undefined,
      status: isTaskCompleted ? "completed" : "processing",
      walletAddress: get(hunter, "address", ""),
      metadata: {
        uniqueId: isEmpty(existedUniqueId) ? uniqueId : existedUniqueId,
      },
    }
  );

  return successResponse(200, {
    uniqueId,
    task: get(processRecord, "taskCode", ""),
    apply: res,
  });
};

const updateInApTrialTaskWithUniqueId = async (ctx, request, data) => {
  const { api_key, secret_key, taskCode, stepCode, uniqueId } = data;
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

  const processRecord = await strapi.services["pending-app-process"].findOne({
    task: keyTask.id,
    uniqueId,
  });

  if (isEmpty(processRecord)) {
    await strapi.services["pending-app-process"].create({
      taskCode,
      uniqueId,
      task: keyTask.id,
      data: [stepCode],
    });
    return successResponse(200, {
      uniqueId,
      task: taskCode,
    });
  }

  await strapi.services["pending-app-process"].update(
    { id: processRecord.id },
    {
      taskCode,
      data: uniq([...get(processRecord, "data", []), stepCode]),
    }
  );

  const hunter = get(processRecord, "hunter", {});
  if (isEmpty(hunter)) {
    return successResponse(200, {
      uniqueId,
      task: taskCode,
    });
  }

  const task = get(processRecord, "task", {});
  if (isEmpty(task)) {
    return requestError(500, "Internal server error");
  }

  let apply;
  // Get existed apply with hunter and task above
  apply = await strapi.services.apply.findOne({
    hunter: hunter.id,
    task: task.id,
  });
  let existedUniqueId = get(apply, "metadata.uniqueId", "");

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
      if (
        currentReferStepCode === stepCode ||
        includes(processRecord.data, currentReferStepCode)
      ) {
        return { ...step, finished: true };
      } else return step;
    }
  );
  const updatedData = {
    ...apply.data,
    [APP_TRIAL_TYPE]: appTrialDataWithUpdatedStep,
  };
  var isTaskCompleted = true;
  for (const key in updatedData) {
    if (Object.hasOwnProperty.call(updatedData, key)) {
      const element = updatedData[key];
      if (element.every((step) => step.finished)) {
        continue;
      } else {
        isTaskCompleted = false;
        break;
      }
    }
  }

  if (isEmpty(get(hunter, "address", ""))) {
    isTaskCompleted = false;
  }
  // Sync updated apply data with database
  await strapi.services.apply.update(
    { id: apply.id },
    {
      data: updatedData,
      completeTime: isTaskCompleted ? moment().toISOString() : undefined,
      status: isTaskCompleted ? "completed" : "processing",
      walletAddress: get(hunter, "address", ""),
      metadata: {
        uniqueId: isEmpty(existedUniqueId) ? uniqueId : existedUniqueId,
      },
    }
  );

  return successResponse(200, {
    uniqueId,
    task: taskCode,
  });
};

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

  const processRecord = await strapi.services["pending-app-process"].findOne({
    task: keyTask.id,
    walletAddress,
  });

  // Test hunter wallet address matched with requested wallet address
  let hunter = await strapi.services.hunter.findOne({
    address: walletAddress,
  });

  // Test there is task existed with requested keyTask
  const task = await strapi.services.task.findOne({ id: keyTask.id });

  if (isEmpty(task)) {
    return requestError(500, "Task not found");
  }

  if (isEmpty(processRecord)) {
    if (isEmpty(hunter)) {
      await strapi.services["pending-app-process"].create({
        taskCode,
        walletAddress,
        task: keyTask.id,
        data: [stepCode],
        hunter: !isEmpty(hunter) ? hunter.id : undefined,
      });
      return successResponse(200, {
        walletAddress,
        task: taskCode,
      });
    } else if (!isEmpty(hunter)) {
      await strapi.services["pending-app-process"].create({
        taskCode,
        walletAddress,
        task: keyTask.id,
        data: [stepCode],
        hunter: !isEmpty(hunter) ? hunter.id : undefined,
      });
    }
  } else {
    await strapi.services["pending-app-process"].update(
      { id: processRecord.id },
      {
        taskCode,
        data: uniq([...get(processRecord, "data", []), stepCode]),
        hunter: !isEmpty(hunter) ? hunter.id : undefined,
      }
    );
  }

  if (isEmpty(hunter)) {
    hunter = get(processRecord, "hunter", {});
    if (isEmpty(hunter)) {
      return successResponse(200, {
        walletAddress,
        task: taskCode,
      });
    }
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
      if (
        currentReferStepCode === stepCode ||
        includes(get(processRecord, "data", []), currentReferStepCode)
      ) {
        return { ...step, finished: true };
      } else return step;
    }
  );
  const updatedData = {
    ...apply.data,
    [APP_TRIAL_TYPE]: appTrialDataWithUpdatedStep,
  };
  var isTaskCompleted = true;
  for (const key in updatedData) {
    if (Object.hasOwnProperty.call(updatedData, key)) {
      const element = updatedData[key];
      if (element.every((step) => step.finished)) {
        continue;
      } else {
        isTaskCompleted = false;
        break;
      }
    }
  }

  if (isEmpty(get(hunter, "address", ""))) {
    isTaskCompleted = false;
  }
  // Sync updated apply data with database
  await strapi.services.apply.update(
    { id: apply.id },
    {
      data: updatedData,
      completeTime: isTaskCompleted ? moment().toISOString() : undefined,
      status: isTaskCompleted ? "completed" : "processing",
      walletAddress: get(hunter, "address", ""),
    }
  );

  return successResponse(200, {
    walletAddress,
    task: taskCode,
  });
};

const createIndividualSocialTask = async (ctx) => {
  // TOKEN A
  // tokenAddress: this.projectInfo.tokenAddress,
  // rewardAmount: this.projectInfo.rewardAmount,
  // tokenName: this.projectInfo.tokenName,
  //version
  //poolId
  const user = ctx.state.user;
  const projectOwner = await strapi.services["project-owner"].findOne({
    id: user.projectOwner,
  });
  if (!projectOwner.address) {
    return ctx.forbidden("You must have an address to create a task");
  }
  const platform = getPlatformFromContext(ctx);
  const requestBody = pick(ctx.request.body, [
    "name",
    // type='bounty'
    //status ='upcoming'
    "tokenBasePrice",
    "rewardAmount",
    "startTime",
    "endTime",
    // "maxParticipants",
    "maxPriorityParticipants",
    "data",
    "metadata",
    "priorityRatio",
    "tokenAddress",
    "tokenName",
    "version",
    "poolId",
    "feeTokenName",
    "feeTokenAmount",
    "feeTokenAddress",
  ]);

  const requestBodySchema = joi.object({
    name: joi.string().required(),
    tokenBasePrice: joi.string().required(),
    rewardAmount: joi.string().required(),
    startTime: joi.string().required(),
    endTime: joi.string().required(),
    maxPriorityParticipants: joi.number().required(),
    //
    data: joi.object().required(),
    metadata: joi.object().required(),
    priorityRatio: joi.number().required(),
    //
    tokenAddress: joi.string().optional(),
    tokenName: joi.string().required(),
    //
    version: joi.string().required(),
    poolId: joi.number().required(),
    feeTokenName: joi.string().required(),
    feeTokenAmount: joi.string().required(),
    feeTokenAddress: joi.string().required(),
  });

  try {
    await requestBodySchema.validateAsync(requestBody);
  } catch (error) {
    console.log(error.message);
    console.log(error.details);
    return ctx.badRequest(error.message, error.details);
  }

  if (moment(requestBody.startTime).isBefore(moment())) {
    return ctx.badRequest("Start time must be in the future");
  }
  //end time must be in the future
  if (moment(requestBody.endTime).isBefore(moment())) {
    return ctx.badRequest("End time must be in the future");
  }
  //start time must be before end time
  if (moment(requestBody.startTime).isAfter(moment(requestBody.endTime))) {
    return ctx.badRequest("Start time must be before end time");
  }

  const data = pick(requestBody.data, [
    "twitter",
    "telegram",
    "discord",
    "facebook",
    "optional",
  ]);

  if (size(data) === 0) {
    return ctx.badRequest("Missing mission data");
  }

  const metadata = merge(
    pick(requestBody.metadata, [
      "shortDescription",
      "decimals",
      "projectLogo",
      "tokenLogo",
      "coverImage",
      "caption",
      "socialLinks",
      "website",
    ]),
    {
      rewardToken: requestBody.tokenName,
      tokenContractAddress: requestBody.tokenAddress,
    }
  );

  const priorityRatio = requestBody.priorityRatio || 0;
  const priorityRewardAmount =
    (toNumber(requestBody.rewardAmount) * priorityRatio) / 100;

  if (
    (priorityRatio === 0 && requestBody.maxPriorityParticipants !== 0) ||
    (priorityRatio !== 0 && requestBody.maxPriorityParticipants === 0)
  ) {
    return ctx.badRequest(
      "Invalid priority ratio and max priority participants"
    );
  }

  const votingPoolData = {
    projectName: requestBody.name,
    data: {
      ...metadata,
      optionalTokenAddress: get(metadata, "tokenContractAddress", ""),
      optionalTokenName: get(metadata, "rewardToken", ""),
      optionalTokenLogo: get(metadata, "tokenLogo", ""),
      optionalRewardAmount: requestBody.rewardAmount,
    },
    type: "bounty",
    managementType: "individual",
    status: "approved",
    startDate: requestBody.startTime,
    endDate: requestBody.endTime,
    ownerAddress: projectOwner.address,
    unicodeName: kebabCase(requestBody.name) + "-" + moment().unix().toString(),
    totalMission: "1",
    totalMissions: "1",
    votingStart: requestBody.startTime,
    votingEnd: requestBody.endTime,
    projectOwner: projectOwner.id,
    platform,
    version: requestBody.version,
    poolId: requestBody.poolId,
    tokenName: requestBody.feeTokenName,
    rewardAmount: requestBody.feeTokenAmount,
    tokenAddress: requestBody.feeTokenAddress,
    // tokenAddress: requestBody.tokenAddress,
    // tokenName: requestBody.tokenName,
    // chain: "bsc",
    // chainId
  };

  const pool = await strapi.services["voting-pool"].createVotingPool(
    ctx,
    votingPoolData,
    true
  );

  if (!pool) {
    return ctx.badRequest("Contract can not identify this record");
  }

  if (pool.usedMission >= pool.totalMission) {
    return ctx.conflict(EXCEEDED_MISSION_LIMIT);
  }

  let task;
  try {
    task = await strapi.services.task.create({
      ...requestBody,
      votingPool: pool.id,
      name: requestBody.name,
      type: "bounty",
      status: "upcoming",
      platform,
      priorityRatio,
      priorityRewardAmount: `${priorityRewardAmount}`,
      data: data,
      metadata: metadata,
      projectOwner: projectOwner.id,
      optionalTokens: [],
      managementType: "individual",
      poolId: pool.poolId,
      version: pool.version,
    });
  } catch (error) {
    console.log("error");
    console.log(error);
    if (pool) await strapi.services["voting-pool"].delete({ id: pool.id });
    return ctx.badRequest(error);
  }
  if (task === null) {
    return ctx.badRequest("cannot create task");
  }
  return task;
};

const createIndividualLearnTask = async (ctx) => {
  const platform = getPlatformFromContext(ctx);

  const user = ctx.state.user;
  const projectOwner = await strapi.services["project-owner"].findOne({
    id: user.projectOwner,
  });
  if (!projectOwner.address) {
    return ctx.forbidden("You must have an address to create a task");
  }

  const requestBody = pick(ctx.request.body, [
    "name",
    // type='bounty'
    //status ='upcoming'
    "tokenBasePrice",
    "rewardAmount",
    "startTime",
    "endTime",
    "maxParticipants",
    "maxPriorityParticipants",
    // data
    "quizData",
    "data",
    "metadata",
    // token
    "priorityRatio",
    "tokenAddress",
    "tokenName",
  ]);

  const requestBodySchema = joi.object({
    name: joi.string().required(),
    tokenBasePrice: joi.string().required(),
    rewardAmount: joi.string().required(),
    startTime: joi.string().required(),
    endTime: joi.string().required(),
    maxParticipants: joi.number().required(),
    maxPriorityParticipants: joi.number().required(),
    //data
    data: joi.object().required(),
    metadata: joi.object().required(),
    quizData: joi.object().required(),
    //
    priorityRatio: joi.number().required(),
    tokenAddress: joi.string().optional(),
    tokenName: joi.string().required(),
    //
    version: joi.string().required(),
    poolId: joi.number().required(),
    feeTokenName: joi.string().required(),
    feeTokenAmount: joi.string().required(),
    feeTokenAddress: joi.string().required(),
  });

  try {
    await requestBodySchema.validateAsync(requestBody);
  } catch (error) {
    console.log(error.message);
    console.log(error.details);
    return ctx.badRequest(error.message, error.details);
  }

  const poolAndFee = pick(ctx.request.body, [
    // pool and fee
    "version",
    "poolId",
    "feeTokenName",
    "feeTokenAmount",
    "feeTokenAddress",
  ]);

  const metadata = merge(
    pick(requestBody.metadata, [
      "shortDescription",
      "decimals",
      "projectLogo",
      "tokenLogo",
      "coverImage",
      "caption",
      "socialLinks",
      "website",
    ]),
    {
      rewardToken: requestBody.tokenName,
      tokenContractAddress: requestBody.tokenAddress,
    }
  );

  // Start time end time section
  const timePairValidation = await validateIndividualTaskTimePair(
    pick(requestBody, ["startTime", "endTime"])
  );
  if (!timePairValidation.ok) {
    return ctx.badRequest(timePairValidation.error || "");
  }
  // End of time pair validation

  //Voting pool validation
  const poolValidation = await validatePoolData(
    requestBody,
    metadata,
    poolAndFee,
    projectOwner,
    ctx
  );
  if (!poolValidation.ok) {
    return ctx.badRequest(poolValidation.error || "");
  }
  const pool = poolValidation.pool;
  //End of voting pool validation

  // Create Quiz section
  const quizValidation = await validateQuizData(
    merge(
      pick(get(requestBody, "quizData", {}), [
        "name",
        "description",
        "learningInformation",
        "data",
        "answer",
        "metadata",
      ]),
      {
        ownerAddress: projectOwner.address,
        projectOwner: projectOwner.id,
      }
    ),
    pick(requestBody.data, ["quiz"]),
    ctx
  );
  if (!quizValidation.ok) {
    if (pool) strapi.services["voting-pool"].delete({ id: pool.id });
    return ctx.badRequest(quizValidation.error || "");
  }

  const data = quizValidation.data;
  const quiz = quizValidation.quiz;
  // End of Create Quiz section

  const priorityRatio = requestBody.priorityRatio || 0;
  const priorityRewardAmount =
    (toNumber(requestBody.rewardAmount) * priorityRatio) / 100;

  if (
    (priorityRatio === 0 && requestBody.maxPriorityParticipants !== 0) ||
    (priorityRatio !== 0 && requestBody.maxPriorityParticipants === 0)
  ) {
    return ctx.badRequest(
      "Invalid priority ratio and max priority participants"
    );
  }

  let task;

  try {
    task = await strapi.services.task.create({
      ...requestBody,
      votingPool: pool.id,
      name: requestBody.name,
      type: "learn",
      status: "upcoming",
      platform,
      priorityRatio,
      priorityRewardAmount: `${priorityRewardAmount}`,
      data: data,
      metadata: metadata,
      projectOwner: projectOwner.id,
      optionalTokens: [],
      managementType: "individual",
      poolId: pool.poolId,
      version: pool.version,
    });
  } catch (error) {
    console.log("error");
    console.log(error);
    if (pool) await strapi.services["voting-pool"].delete({ id: pool.id });
    return ctx.badRequest(error);
  }
  if (task === null) {
    return ctx.badRequest("cannot create task");
  }
  return task;
};

const validateQuizData = async (quizData, questData, ctx) => {
  if (quizData.data.length !== quizData.answer.length) {
    return {
      ok: false,
      error: "Quiz data and answer must have the same length",
    };
  }

  if (!questData.quiz && questData.quiz.length !== 1) {
    return { ok: false, error: "Task data must have one quiz" };
  }
  // "type": "quiz",
  // "quizId": "6410186738151e4fd5272744",
  // "passingCriteria": 1,
  // "questionsPerQuiz": 4,
  // "canRepeat": true
  const questQuizData = pick(questData.quiz[0], [
    "passingCriteria",
    "questionsPerQuiz",
    "canRepeat",
  ]);

  if (!questQuizData.passingCriteria) {
    questQuizData["passingCriteria"] = 1;
  }

  if (!questQuizData.questionsPerQuiz) {
    return {
      ok: false,
      error: "Missing required fields: questionsPerQuiz",
    };
  }

  if (questQuizData.questionsPerQuiz > quizData.data.length) {
    return {
      ok: false,
      error: "questionsPerQuiz must be less than or equal to quiz data length",
    };
  }

  if (!questQuizData.canRepeat) {
    questQuizData["canRepeat"] = false;
  } else {
    questQuizData["canRepeat"] = true;
  }

  const quiz = await strapi.services["quiz"].createQuiz(ctx, quizData);

  return {
    ok: true,
    quiz: quiz,
    data: {
      quiz: [
        {
          ...questQuizData,
          type: "quiz",
          quizId: quiz.id,
        },
      ],
    },
  };
};

const validatePoolData = async (
  requestBody,
  metadata,
  poolAndFee,
  projectOwner,
  ctx
) => {
  try {
    const platform = getPlatformFromContext(ctx);

    if (size(poolAndFee) !== 5) {
      return { ok: false, error: "Missing required fields: pool and fee" };
    }
    const votingPoolData = {
      projectName: requestBody.name,
      data: {
        ...metadata,
        optionalTokenAddress: get(metadata, "tokenContractAddress", ""),
        optionalTokenName: get(metadata, "rewardToken", ""),
        optionalTokenLogo: get(metadata, "tokenLogo", ""),
        optionalRewardAmount: requestBody.rewardAmount,
      },
      type: "bounty",
      managementType: "individual",
      status: "approved",
      startDate: requestBody.startTime,
      endDate: requestBody.endTime,
      ownerAddress: projectOwner.address,
      unicodeName:
        kebabCase(requestBody.name) + "-" + moment().unix().toString(),
      totalMission: "1",
      votingStart: requestBody.startTime,
      votingEnd: requestBody.endTime,
      projectOwner: projectOwner.id,
      platform,
      version: poolAndFee.version,
      poolId: poolAndFee.poolId,
      tokenName: poolAndFee.feeTokenName,
      rewardAmount: poolAndFee.feeTokenAmount,
      tokenAddress: poolAndFee.feeTokenAddress,
      // tokenAddress: requestBody.tokenAddress,
      // tokenName: requestBody.tokenName,
      // chain: "bsc",
      // chainId
    };

    const pool = await strapi.services["voting-pool"].createVotingPool(
      ctx,
      votingPoolData,
      true
    );

    if (!pool) {
      return { ok: false, error: "Contract can not identify this record" };
    }

    if (pool.usedMission >= pool.totalMission) {
      return {
        ok: false,
        error: EXCEEDED_MISSION_LIMIT,
      };
    }
    console.log(pool);
    return { ok: true, pool };
  } catch (error) {
    console.log(error);
    return { ok: false, error: error };
  }
};

const validateIndividualTaskTimePair = (data) => {
  if (!data.startTime || !data.endTime) {
    return {
      ok: false,
      error: "Start time and end time are required",
    };
  }
  if (moment(data.startTime).isBefore(moment())) {
    return {
      ok: false,
      error: "Start time must be in the future",
    };
  }
  //end time must be in the future
  if (moment(data.endTime).isBefore(moment())) {
    return {
      ok: false,
      error: "End time must be in the future",
    };
  }
  //start time must be before end time
  if (moment(data.startTime).isAfter(moment(data.endTime))) {
    return {
      ok: false,
      error: "Start time must be before end time",
    };
  }
  return {
    ok: true,
  };
};
module.exports = {
  createIndividualSocialTask,
  createIndividualLearnTask,
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
  updateInApTrialTaskWithUniqueId,
  mapHunterWithTaskProcessRecord,
  exportTaskHuntersWithoutReward,
  exportTaskRewards,
  updateTask,
  updateBaseTaskIat,
  updateTaskParticipantFromTwitter,
};
