"use strict";
const twitterHelper = require("../../../helpers/twitter-helper");
const { get, merge, isEqual } = require("lodash");
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
    async beforeUpdate(params, { data, task }) {
      const res = await validateTwitterLinks(
        merge(
          get(data, "twitter", []).map((step) => {
            return {
              ...step,
              submitedLink: step.link,
            };
          }),
          get(task, "data.twitter", [])
        )
      );
      if (res) throw strapi.errors.badRequest(res);
    },
  },
};

const validateTwitterLinks = async (taskData) => {
  for (const currentStepObj of taskData) {
    if (!isNeedToValidate(currentStepObj)) continue;
    if (!twitterHelper.isTwitterStatusLink(currentStepObj.submitedLink))
      return "Invalid twitter link";
    const tweetData = await extractTweetData(currentStepObj.submitedLink);
    if (tweetData.errorMsg) return tweetData.errorMsg;
    const errorMsg = validateTweetData(
      tweetData,
      currentStepObj,
      currentStepObj.type
    );
    if (errorMsg) return errorMsg;
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

const validateTweetData = (data, baseRequirement, type) => {
  if (type === "follow") return verifyTwitterFollow();
  if (type === "tweet") return verifyTweetLink(data, baseRequirement);
  if (type === "retweet") return verifyRetweetLink(data, baseRequirement);
};

const verifyTwitterFollow = () => {
  return "";
};

const verifyTweetLink = (data, baseRequirement) => {
  const content = get(data, "text", "");
  if (content.includes(baseRequirement.hashtag)) return "";
  return "Tweet link missing required hashtag";
};

const verifyRetweetLink = (data, baseRequirement) => {
  const referencedTweets = get(data, "referenced_tweets", []);
  if (!referencedTweets) return "Link missing required referenced tweet";
  const baseTweetId = twitterHelper.getTweetIdFromLink(baseRequirement.link);
  // Check if there were required tweet in referenced tweets list
  for (let index = 0; index < referencedTweets.length; index++) {
    const tweet = referencedTweets[index];
    if (isEqual(tweet.id, baseTweetId)) return "";
  }
  return "Link missing required referenced tweet";
};
