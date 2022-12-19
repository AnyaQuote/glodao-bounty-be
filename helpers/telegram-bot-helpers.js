const axios = require("axios");

const API_TOKEN = process.env.TELEGRAM_BOT_API_TOKEN;
const API_TOKEN_YGG = process.env.TELEGRAM_BOT_API_TOKEN_YGG;

const switchTokenUsingPlatform = (platform) => {
  switch (platform) {
    case "gld":
      return API_TOKEN;
    case "ygg":
      return API_TOKEN_YGG;
    default:
      return API_TOKEN;
  }
};

const getBotIdUsingPlatform = (platform) => {
  switch (platform) {
    case "gld":
      return process.env.TELEGRAM_BOT_ID;
    case "ygg":
      return process.env.TELEGRAM_BOT_ID_YGG;
    default:
      return process.env.TELEGRAM_BOT_ID;
  }
};

const getChatMember = async (chat, userId, platform = "gld") => {
  const apiToken = switchTokenUsingPlatform(platform);
  try {
    const { data } = await axios.get(
      `https://api.telegram.org/bot${apiToken}/getChatMember?chat_id=@${chat}&user_id=${userId}`
    );
    return data;
  } catch (error) {
    return error.response.data;
  }
};

const isUserFollowChat = async (chat, userId, platform = "gld") => {
  const res = await getChatMember(chat, userId, platform);
  if (!res.ok) return false;
  const { result } = res;
  if (result.status !== "left") return true;
  else return false;
};

const getChatFromLink = (link) => {
  const splitedArr = link.split("/");
  return splitedArr[splitedArr.length - 1].split("?")[0];
};

module.exports = {
  getChatMember,
  isUserFollowChat,
  getChatFromLink,
  getBotIdUsingPlatform,
};
