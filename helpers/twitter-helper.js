const axios = require("axios");

const TWITTER_API_BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAALuUaQEAAAAAI7IuqJFxrj4iWWQHxJA5rTIKWRM%3D7vpzpWFdqpjuhKqdCm0Jr1BSVhnfc8mIKjPTkvWUmLjOqHBwEw";

const isTwitterStatusLink = (link) => {
  if (
    link.match(
      /^((?:http:\/\/)?|(?:https:\/\/)?)?(?:www\.)?twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/i
    ) ||
    link.match(/^@?(\w+)$/)
  )
    return true;
  return false;
};

const getTweetDataByTweetId = async (id) => {
  console.log(id);
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

const getTweetIdFromLink = (link) => {
  const splitedArr = link.split("/");
  return splitedArr[splitedArr.length - 1].split("?")[0];
};

module.exports = {
  isTwitterStatusLink,
  getTweetDataByTweetId,
  getTweetIdFromLink,
};
