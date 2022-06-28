const axios = require("axios");

const TWITTER_API_BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAALuUaQEAAAAAEBsacTfmkY4%2BoEw37K7eaR%2FB7Dg%3DfNoM30JKw2Rn5PWAxYJOIbmQMOzIaK3y4XYzcZu31eTt3Yxwg2";
const TWEET_API_URL = "https://api.twitter.com/2/tweets";
const USER_API_URL = "https://api.twitter.com/2/users";

const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${TWITTER_API_BEARER_TOKEN}`,
  },
});

const { get, size } = require("lodash");

/**
 * Check if link is a valid twitter link
 * @param {string} link Base link
 * @returns {boolean} If link is a valid twitter link
 */
const isTwitterStatusLink = (link) => {
  if (
    link.match(
      /^((?:http:\/\/)?|(?:https:\/\/)?)?((?:www\.)?|(?:mobile\.)?)?twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/i
    ) ||
    link.match(/^@?(\w+)$/)
  )
    return true;
  return false;
};

/**
 * Get tweet data from id
 * @param {string} id Status tweet id
 * @returns {object} Tweet data with id and text
 */
const getTweetDataByTweetId = async (id) => {
  try {
    const { data } = await axios.get(`${TWEET_API_URL}/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get tweet data from id and optionial params
 * @param {string} id Status tweet id
 * @param {string=} tweetFields Optional fields need to get
 * @param {string=} expansions Fields that need to get more detail
 * @param {object=} params Optional params
 * @returns {object} Tweet data
 */
const getTweetData = async (
  id,
  tweetFields = "attachments,author_id,created_at,public_metrics,source,referenced_tweets,conversation_id",
  expansions = "author_id",
  params = {}
) => {
  try {
    const { data } = await axiosInstance.get(`${TWEET_API_URL}`, {
      params: {
        ids: id,
        "tweet.fields": tweetFields,
        expansions,
        ...params,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get tweet id from status tweet link
 * @param {string} link Base link
 * @returns {string} id of tweet link
 */
const getTweetIdFromLink = (link) => {
  if (!isTwitterStatusLink(link)) return "";
  const splitedArr = link.split("/");
  return splitedArr[splitedArr.length - 1].split("?")[0];
};

/**
 * Get 100 liked tweets from user with userId
 * @param {string} userId userid
 * @param {string} pagination_token pagination indicator
 * @param {string} expansions fields need to get more data
 * @param {object} params optional params
 * @returns {Promise}
 */
const getUserLikedTweets = async (
  userId,
  pagination_token = "",
  expansions = "",
  params = {}
) => {
  try {
    const { data } = await axiosInstance.get(
      `${USER_API_URL}/${userId}/liked_tweets`,
      {
        params: {
          max_results: 100,
          pagination_token: pagination_token ? pagination_token : undefined,
          expansions: expansions ? expansions : undefined,
          // ...params,
        },
      }
    );
    return data;
  } catch (error) {
    throw error;
  }
};

const getTweetLikedUsers = async (
  tweetId,
  pagination_token = "",
  expansions = "",
  userFields = "created_at,withheld,location,public_metrics,url,verified,protected,entities",
  params = {}
) => {
  try {
    const { data } = await axiosInstance.get(
      `${TWEET_API_URL}/${tweetId}/liking_users`,
      {
        params: {
          max_results: 100,
          pagination_token: pagination_token ? pagination_token : undefined,
          expansions: expansions ? expansions : undefined,
          "user.fields": userFields,
          ...params,
        },
      }
    );
    return data;
  } catch (error) {
    throw error;
  }
};

const isTweetLengthValid = (data, min = 0, max = 350) => {
  const text = get(data, "full_text", "") || get(data, "text", "");
  return size(text) >= min && size(text) <= max;
};

module.exports = {
  isTwitterStatusLink,
  getTweetDataByTweetId,
  getTweetIdFromLink,
  getTweetData,
  getUserLikedTweets,
  isTweetLengthValid,
  getTweetLikedUsers,
};
