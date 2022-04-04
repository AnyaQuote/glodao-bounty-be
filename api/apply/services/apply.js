"use strict";
const twitterHelper = require("../../../helpers/twitter-helper");
const _ = require("lodash");
const moment = require("moment");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Update pool type of an apply
 * @param {string} id Apply id
 * @param {string} poolType New pool type
 * @returns Pool type updated apply
 */
const updateApplyPoolType = async (id, poolType) => {
  return await strapi.services.apply.update(
    {
      id,
    },
    {
      poolType,
    }
  );
};

/**
 * Update task data of an apply
 * @param {string} id Apply id
 * @param {object} taskData Apply's task data
 * @returns {Promise}
 */
const updateApplyTaskDataById = async (id, taskData) => {
  return await strapi.services.apply.update(
    {
      id,
    },
    {
      data: taskData,
    }
  );
};

/**
 * Update apply status to new status
 * @param {string} id Apply id
 * @param {string} status new status
 * @returns {Promise} Updated apply
 */
const changeApplyStatus = async (id, status) => {
  return await strapi.services.apply.update(
    {
      id,
    },
    {
      status,
    }
  );
};

/**
 * Change apply status to complete
 * @param {string} id Apply id
 * @returns {Promise} Updated apply
 */
const changeApplyStatusToCompleted = async (id) => {
  return await changeApplyStatus(id, "completed");
};

/**
 * Update pool type of an apply to 'priority'
 * @param {string} id Apply id
 * @returns Updated apply
 */
const moveApplyToPriorityPool = async (id) => {
  return await updateApplyPoolType(id, "priority");
};

/**
 * Update pool type of an apply to 'community'
 * @param {string} id Apply id
 * @returns Updated apply
 */
const moveApplyToCommunityPool = async (id) => {
  return await updateApplyPoolType(id, "community");
};

const validateTwitterTask = async (
  taskData,
  taskCreatedTime,
  userTwitterId
) => {
  const groupByStepLink = _.groupBy(taskData, "submitedLink");
  for (const [key, value] of Object.entries(groupByStepLink)) {
    if (_.isEmpty(key)) continue;
    if (value.length > 1) return "This twitter link had been used before";
  }
  return await validateTwitterLinks(taskData, taskCreatedTime, userTwitterId);
};

const validateTwitterLinks = async (
  taskData,
  taskCreatedTime,
  userTwitterId
) => {
  for (let index = 0; index < taskData.length; index++) {
    const currentStepObj = taskData[index];
    if (!isNeedToValidate(currentStepObj)) continue;
    if (!twitterHelper.isTwitterStatusLink(currentStepObj.submitedLink))
      return "Invalid twitter link";
    const tweetData = await extractTweetData(currentStepObj.submitedLink);
    if (tweetData.errorMsg) return tweetData.errorMsg;
    const errorMsg = validateTweetData(
      tweetData,
      currentStepObj,
      currentStepObj.type,
      taskCreatedTime,
      userTwitterId
    );
    if (errorMsg) {
      if (_.isEqual(errorMsg, "Empty data")) return index;
      else return errorMsg;
    }
  }

  return "";
};

const isNeedToValidate = (stepData) => {
  if (stepData.type === "follow" || !stepData.finished) return false;
  return true;
};

const extractTweetData = async (link) => {
  try {
    return await twitterHelper.getTweetData(
      twitterHelper.getTweetIdFromLink(link)
    );
  } catch (error) {
    return { errorMsg: "Get tweet data error" };
  }
};

const validateTweetData = (
  tweetData,
  baseRequirement,
  type,
  taskCreatedTime,
  userTwitterId
) => {
  const data = _.get(tweetData, "data[0]", {});
  if (_.isEmpty(data)) return "Empty data";
  if (!moment(data.created_at).isAfter(moment(taskCreatedTime)))
    return "Tweet posted time is invalid - Tweet must be posted after the task started";
  if (!_.isEqual(userTwitterId, data.author_id))
    return "Author of the tweet is invalid";
  if (type === "follow") return verifyTwitterFollow();
  if (type === "tweet") return verifyTweetLink(data, baseRequirement);
  if (type === "quote") return verifyRetweetLink(data, baseRequirement);
};

const verifyTwitterFollow = () => {
  return "";
};

const verifyTweetLink = (data, baseRequirement) => {
  const content = _.get(data, "text", "");
  if (_.toLower(content).includes(_.toLower(`#${baseRequirement.hashtag}`)))
    return "";
  return "Tweet link missing required hashtag";
};

const verifyRetweetLink = (data, baseRequirement) => {
  if (
    !_.isEmpty(_.get(baseRequirement, "hashtag", "")) &&
    !_.toLower(_.get(data, "text", "")).includes(
      _.toLower(`#${baseRequirement.hashtag}`)
    )
  )
    return "Tweet link missing required hashtag";
  const referencedTweets = _.get(data, "referenced_tweets", []);
  if (!referencedTweets) return "Link missing required referenced tweet";
  const baseTweetId = twitterHelper.getTweetIdFromLink(baseRequirement.link);
  // Check if there were required tweet in referenced tweets list
  for (let index = 0; index < referencedTweets.length; index++) {
    const tweet = referencedTweets[index];
    if (_.isEqual(tweet.id, baseTweetId)) return "";
  }
  return "Link missing required referenced tweet";
};

module.exports = {
  moveApplyToPriorityPool,
  moveApplyToCommunityPool,
  updateApplyTaskDataById,
  changeApplyStatusToCompleted,
  validateTwitterLinks,
  validateTwitterTask,
};
