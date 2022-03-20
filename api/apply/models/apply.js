"use strict";
const twitterHelper = require("../../../helpers/twitter-helper");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called before an entry is created
    async beforeUpdate(params, data) {
      try {
        const twitterStepData = data.data.twitter || [];
        const twitterTaskBaseData = data.task.data.twitter || [];
        const res = await validateTwitterLinks(
          twitterStepData,
          twitterTaskBaseData
        );
        if (!res) throw strapi.errors.badRequest("Invalid link");
      } catch (error) {
        throw error;
      }
    },
  },
};

/**
 * Check if updated twitterStepData met task requirement
 * @param {array} twitterStepData Apply data
 * @param {array} twitterTaskBaseData Corresponding task requirement
 * @returns {boolean} If updated twitterStepData met task requirement
 */
const validateTwitterLinks = async (twitterStepData, twitterTaskBaseData) => {
  for (let step = 0; step < twitterStepData.length; step++) {
    const currentStepObj = twitterStepData[step];
    if (currentStepObj.type === "follow" || !currentStepObj.finished) continue;
    const { link } = currentStepObj;
    if (!twitterHelper.isTwitterStatusLink(link)) return false;
    const tweetData = await twitterHelper.getTweetData(
      twitterHelper.getTweetIdFromLink(link)
    );
    if (
      !validateTweetData(
        tweetData,
        twitterTaskBaseData[step],
        currentStepObj.type
      )
    )
      return false;
  }
  return true;
};

/**
 * Check if tweet data have met specific task requirement
 * @param {object} data Tweet data
 * @param {object} baseRequirement Task data
 * @param {string} type Type of task
 * @returns {boolean} if tweet data have finished task requirement
 */
const validateTweetData = (data, baseRequirement, type) => {
  if (type === "follow") return true;
  if (type === "tweet") {
    const content = data.text;
    if (content.includes(baseRequirement.hashtag)) return true;
    return false;
  }
  if (type === "retweet") {
    const referencedTweets = data.referenced_tweets;
    if (!referencedTweets || referencedTweets.length === 0) return false;
    const baseTweetId = twitterHelper.getTweetIdFromLink(baseRequirement.link);
    // Check if there were required tweet in referenced tweets list
    for (let index = 0; index < referencedTweets.length; index++) {
      const tweet = referencedTweets[index];
      if (tweet.id === baseTweetId) return true;
    }
    return false;
  }
};
