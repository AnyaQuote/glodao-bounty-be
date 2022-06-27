"use strict";
const twitterHelper = require("../../../helpers/twitter-helper");
const twitterHelperV1 = require("../../../helpers/twitter-helper-v1");
const _ = require("lodash");
const moment = require("moment");
const { TWEET_MIN_WORDS_COUNT } = require("../../../constants");
const {
  getWordsCount,
  getArrDiff,
  isArrayIncluded,
} = require("../../../helpers/index");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Update an apply to completed status
 * @param {string} id Apply id
 * @param {string} walletAddress wallet address for apply
 * @returns Pool type updated apply
 */
const updateApplyStateToComplete = async (id, walletAddress) => {
  return await strapi.services.apply.update(
    { id },
    { walletAddress, status: "completed", completeTime: moment().toISOString() }
  );
};

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

const validateTwitterTask = async (taskData, taskCreatedTime, user) => {
  const groupByStepLink = _.groupBy(taskData, "submitedLink");
  for (const [key, value] of Object.entries(groupByStepLink)) {
    if (_.isEmpty(key)) continue;
    if (value.length > 1) return "This twitter link had been used before";
  }

  return await validateTwitterLinks(taskData, taskCreatedTime, user);
};

const validateTwitterLinks = async (taskData, taskCreatedTime, user) => {
  for (let index = 0; index < taskData.length; index++) {
    const currentStepObj = taskData[index];
    if (!isNeedToValidate(currentStepObj)) continue;
    if (_.get(taskData[index + 1], "finished", false)) continue;
    if (currentStepObj.type === "follow") {
      const followErrorMsg = await validateFollowTwitterTask(
        currentStepObj,
        user
      );
      if (followErrorMsg) return followErrorMsg;
      else continue;
    }
    const dataLink = isLinkNotRequired(currentStepObj)
      ? currentStepObj.link
      : currentStepObj.submitedLink;
    if (!twitterHelper.isTwitterStatusLink(dataLink))
      return "Invalid twitter link";

    const tweetData = await extractTweetData(dataLink, user);

    if (tweetData.errorMsg) return tweetData.errorMsg;

    if (currentStepObj.type === "comment") {
      const isNotDuplicated = await strapi.services[
        "tweet-comment-record"
      ].verifyDuplicateCommentContent(
        twitterHelper.getTweetIdFromLink(currentStepObj.link),
        twitterHelper.getTweetIdFromLink(currentStepObj.submitedLink),
        tweetData
      );
      if (!isNotDuplicated)
        return "Invalid tweet content: too similar with other tweets";
      const isWordCorrect = await strapi.services[
        "tweet-comment-record"
      ].isTweetDataWordCorrect(tweetData);
      console.log("is word corret: " + isWordCorrect);
      if (!isWordCorrect) {
        console.log("wrong content");
        return "Invalid tweet content: there are some unmeaning words";
      }
    }

    const errorMsg = validateTweetData(
      tweetData,
      currentStepObj,
      currentStepObj.type,
      taskCreatedTime,
      user.twitterId
    );
    if (errorMsg) {
      if (_.isEqual(errorMsg, "Empty data")) return index;
      else return errorMsg;
    }
  }

  return "";
};

const validateFollowTwitterTask = async (baseRequirement, user) => {
  const { accessToken, accessTokenSecret } = user;
  const splitedArr = baseRequirement.link.split("/");
  const screenName = splitedArr[splitedArr.length - 1].split("?")[0];
  try {
    const res = await twitterHelperV1.getUserByScreenName(
      screenName,
      accessToken,
      accessTokenSecret
    );
    if (!res.following) return "You have not completed this follow task yet";
  } catch (error) {
    return "Can not check follow status";
  }
  return "";
};

const isNeedToValidate = (stepData) => {
  if (
    // stepData.type === "follow" ||
    // stepData.type === "like" ||
    !stepData.finished
  )
    return false;
  return true;
};

const isLinkNotRequired = (stepData) => {
  if (stepData.type === "like" || stepData.type === "follow") return true;
  return false;
};

const extractTweetData = async (link, user) => {
  const { accessToken, accessTokenSecret } = user;

  try {
    return await twitterHelperV1.getTweetData(
      twitterHelper.getTweetIdFromLink(link),
      accessToken,
      accessTokenSecret
    );
  } catch (error) {
    return { errorMsg: "Error: Can not get tweet data" };
  }
};

const validateTweetData = (
  tweetData,
  baseRequirement,
  type,
  taskCreatedTime,
  userTwitterId
) => {
  const data = tweetData;
  if (type !== "like" && type !== "follow") {
    if (_.isEmpty(data)) return "Empty data";
    // if (!moment(data.created_at).isAfter(moment(taskCreatedTime)))
    //   return "Tweet posted time is invalid - Tweet must be posted after the task started";
    if (!_.isEqual(userTwitterId, data.user.id_str))
      return "Author of the tweet is invalid";
  }
  if (type === "follow") return verifyTwitterFollow(data);
  if (type === "like") return verifyLikeTask(data);
  if (type === "tweet") return verifyTweetLink(data, baseRequirement);
  if (type === "quote") return verifyRetweetLink(data, baseRequirement);
  if (type === "comment") return verifyCommentLink(data, baseRequirement);
};

const verifyTwitterFollow = (statusData) => {
  if (!statusData.user.following) return "You have not completed this task yet";
  return "";
};

const verifyLikeTask = (data) => {
  if (!data.favorited) return "You have not liked the tweet yet";
  return "";
};

const verifyTweetLink = (data, baseRequirement) => {
  const text = _.get(data, "full_text", "") || _.get(data, "text", "");
  if (_.lt(getWordsCount(text), TWEET_MIN_WORDS_COUNT))
    return "The length of the submitted tweet is not valid";
  if (
    !_.isEmpty(_.get(baseRequirement, "mentions", "")) &&
    !isUserMentionsIncluded(
      _.get(data, "entities.user_mentions", []),
      baseRequirement.mentions
    )
  )
    return "Tweet link missing required user mentions";
  if (
    isHashtagIncluded(
      _.get(data, "entities.hashtags", []),
      baseRequirement.hashtag
    )
  )
    return "";
  return "Tweet link missing required hashtag";
};

const verifyCommentLink = (data, baseRequirement) => {
  const text = _.get(data, "full_text", "") || _.get(data, "text", "");
  if (_.lt(getWordsCount(text), TWEET_MIN_WORDS_COUNT))
    return "The length of the submitted tweet is not valid";
  if (
    !_.isEmpty(_.get(baseRequirement, "hashtag", "")) &&
    !isHashtagIncluded(data.entities.hashtags, baseRequirement.hashtag)
  )
    return "Tweet link missing required hashtag";
  if (
    !_.isEmpty(_.get(baseRequirement, "mentions", "")) &&
    !isUserMentionsIncluded(
      _.get(data, "entities.user_mentions", []),
      baseRequirement.mentions
    )
  )
    return "Tweet link missing required user mentions";
  const conversation_id = _.get(data, "in_reply_to_status_id_str", "");
  const id = _.get(data, "id_str", "");

  if (
    _.isEqual(
      conversation_id,
      twitterHelper.getTweetIdFromLink(baseRequirement.link)
    ) &&
    !_.isEqual(id, conversation_id)
  )
    return "";

  return "Comment not found";
};

const verifyRetweetLink = (data, baseRequirement) => {
  const text = _.get(data, "full_text", "") || _.get(data, "text", "");
  if (_.lt(getWordsCount(text), TWEET_MIN_WORDS_COUNT))
    return "The length of the submitted tweet is not valid";
  if (
    !_.isEmpty(_.get(baseRequirement, "hashtag", "")) &&
    !isHashtagIncluded(data.entities.hashtags, baseRequirement.hashtag)
  )
    return "Tweet link missing required hashtag";
  // if mission users mentioned the tweet from entities.user_mentions
  if (
    !_.isEmpty(_.get(baseRequirement, "mentions", "")) &&
    !isUserMentionsIncluded(
      _.get(data, "entities.user_mentions", []),
      baseRequirement.mentions
    )
  )
    return "Tweet link missing required user mentions";

  if (!data.is_quote_status) return "Link missing required referenced tweet";
  if (
    _.isEqual(
      data.quoted_status_id_str,
      twitterHelper.getTweetIdFromLink(baseRequirement.link)
    )
  )
    return "";
  return "Link missing required referenced tweet";
};

const validateQuizRecordShareTask = async (link, user, recordId) => {
  try {
    const { accessToken, accessTokenSecret, twitterId } = user;
    if (!twitterHelper.isTwitterStatusLink(link)) return "Invalid twitter link";

    const tweetData = await extractTweetData(link, user);
    if (_.isEmpty(tweetData)) return "Empty data";
    // if (!moment(data.created_at).isAfter(moment(taskCreatedTime)))
    //   return "Tweet posted time is invalid - Tweet must be posted after the task started";
    if (!_.isEqual(twitterId, tweetData.user.id_str))
      return "Author of the tweet is invalid";

    const text =
      _.get(tweetData, "full_text", "") || _.get(tweetData, "text", "");
    for (let index = 0; index < tweetData.entities.urls.length; index++) {
      const urlObj = tweetData.entities.urls[index];
      if (
        _.isEqual(
          urlObj.expanded_url,
          `https://app.glodao.io/quiz-record/${recordId}`
        ) ||
        _.isEqual(urlObj.expanded_url, `app.glodao.io/quiz-record/${recordId}`)
      )
        return "";
    }
    return "Invalid tweet link: missing quiz url";
  } catch (error) {
    console.log(error);
    return "Invalid tweet link";
  }
};

const isHashtagIncluded = (hashtags, requiredHashtag) => {
  return (
    _.findIndex(hashtags, (hashtag) =>
      _.isEqual(_.toLower(hashtag.text), _.toLower(requiredHashtag))
    ) > -1
  );
};

/**
 * check if user mentions are included in the tweet
 * @param {array} mentions
 * @param {array} requiredMention
 * @returns {boolean} true if user mentions are included in the tweet else false
 */
const isUserMentionsIncluded = (mentions, requiredMentions) => {
  return isArrayIncluded(toLower(requiredMentions), toLower(mentions));
};

/**
 * to lower array of strings
 * @param {array} array of strings
 * @returns {array} array of strings
 */
const toLower = (array) => {
  return _.map(array, (item) => _.toLower(item));
};

module.exports = {
  moveApplyToPriorityPool,
  moveApplyToCommunityPool,
  updateApplyTaskDataById,
  changeApplyStatusToCompleted,
  validateTwitterLinks,
  validateTwitterTask,
  validateFollowTwitterTask,
  updateApplyStateToComplete,
  validateQuizRecordShareTask,
};
