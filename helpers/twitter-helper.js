const axios = require("axios");

const TWITTER_API_BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAALuUaQEAAAAAI7IuqJFxrj4iWWQHxJA5rTIKWRM%3D7vpzpWFdqpjuhKqdCm0Jr1BSVhnfc8mIKjPTkvWUmLjOqHBwEw";

const axiosInstance = axios.create({
  timeout: 1000,
  headers: {
    Authorization: `Bearer ${TWITTER_API_BEARER_TOKEN}`,
  },
});

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

const getTweetDataByTweetId = async (id) => {
  try {
    const { data } = await axios.get(`https://api.twitter.com/2/tweets/${id}`, {
      headers: {
        Authorization: `Bearer ${TWITTER_API_BEARER_TOKEN}`,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

const getTweetData = async (
  id,
  tweetFields = "attachments,author_id,created_at,public_metrics,source,referenced_tweets",
  expansions = "",
  params = {}
) => {
  try {
    const { data } = await axiosInstance.get(
      `https://api.twitter.com/2/tweets`,
      {
        params: {
          ids: id,
          "tweet.fields": tweetFields,
          expansions,
          ...params,
        },
      }
    );
    return data.data[0];
  } catch (error) {
    throw error;
  }
};

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
