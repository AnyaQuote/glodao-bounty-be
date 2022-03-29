"use strict";

const {
  checkUserStaked,
} = require("../../../helpers/blockchainHelpers/farm-helper");
const { isNil, get, merge, isEqual } = require("lodash");
const twitterHelper = require("../../../helpers/twitter-helper");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  applyForPriorityPool: async (ctx) => {
    const { walletAddress, applyId, hunterId, taskId, poolId } =
      ctx.request.body;
    const strapiServices = strapi.services;
    if (!walletAddress || !applyId || !hunterId || !taskId || isNil(poolId))
      return ctx.badRequest("Invalid request body: missing fields");

    if (
      await !strapiServices.hunter.isPreRegisteredWalletMatched(
        hunterId,
        walletAddress
      )
    )
      return ctx.unauthorized(
        "Invalid request: Wallet not matched with the pre-registered one"
      );

    if (await !checkUserStaked(poolId, walletAddress))
      return ctx.unauthorized("Invalid request: This wallet has not staked");

    if (await strapiServices.task.isPriorityPoolFullById(taskId))
      return ctx.conflict(
        "Fail to apply for priority pool: Priority pool full"
      );

    return await strapiServices.apply.moveApplyToPriorityPool(applyId);
  },

  updateTaskProcess: async (ctx) => {
    const { id } = ctx.params;
    const { taskData, type, optional } = ctx.request.body;
    const apply = await strapi.services.apply.findOne({ id });
    if (!apply) return ctx.badRequest("Invalid request id");

    if (isEqual(type, "finish")) {
      const walletAddress = get(optional, "walletAddress", "");
      if (!walletAddress)
        return ctx.badRequest("Missing wallet address to earn reward");
      return strapi.services.apply.update(
        { id },
        { walletAddress, status: "completed" }
      );
    }

    const res = await validateTwitterLinks(
      merge(
        get(taskData, [type], []).map((step) => {
          return {
            ...step,
            submitedLink: step.link,
          };
        }),
        get(apply, ["task", "data", type], [])
      )
    );
    if (res) return ctx.badRequest(res);

    return await strapi.services.apply.updateApplyTaskDataById(id, taskData);
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
