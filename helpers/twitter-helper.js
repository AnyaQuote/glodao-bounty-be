const axios = require("axios");

const TWITTER_API_BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAALuUaQEAAAAAI7IuqJFxrj4iWWQHxJA5rTIKWRM%3D7vpzpWFdqpjuhKqdCm0Jr1BSVhnfc8mIKjPTkvWUmLjOqHBwEw";
const TWEET_API_URL = "https://api.twitter.com/2/tweets";

const axiosInstance = axios.create({
  timeout: 1000,
  headers: {
    Authorization: `Bearer ${TWITTER_API_BEARER_TOKEN}`,
  },
});

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
  tweetFields = "attachments,author_id,created_at,public_metrics,source,referenced_tweets",
  expansions = "",
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
    return data.data[0];
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

module.exports = {
  isTwitterStatusLink,
  getTweetDataByTweetId,
  getTweetIdFromLink,
  getTweetData,
};
