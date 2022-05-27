const axios = require("axios");

const API_TOKEN = process.env.TELEGRAM_BOT_API_TOKEN;

const getChatMember = async (chat, userId) => {
  try {
    const { data } = await axios.get(
      `https://api.telegram.org/bot${API_TOKEN}/getChatMember?chat_id=@${chat}&user_id=${userId}`
    );
    return data;
  } catch (error) {
    return error.response.data;
  }
};

const isUserFollowChat = async (chat, userId) => {
  const res = await getChatMember(chat, userId);
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
};
