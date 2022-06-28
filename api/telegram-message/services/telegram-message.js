"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

// is existed ["telegram-message"] by chatUsername and userId _limit 1
const isExistedTelegramMessage = async (chatUsername, userId) => {
  try {
    const res = await strapi.services["telegram-message"].findOne({
      chatUsername,
      userId,
    });
    return res;
  } catch (error) {
    throw error;
  }
};

// delete telegram message by id
const deleteTelegramMessage = async (id) => {
  try {
    return await strapi.services["telegram-message"].delete({ id });
  } catch (error) {
    throw error;
  }
};

//verify telegram chat task
const verifyTelegramChatTask = async (chatUsername, userId) => {
  try {
    const res = await isExistedTelegramMessage(chatUsername, userId);
    if (res) {
      await deleteTelegramMessage(res.id);
      return res;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

// get chatUsername from telegram link
const getChatUsernameFromLink = (link) => {
  if (!isTelegramChatLink(link)) return "";
  const splitedArr = link.split("/");
  return splitedArr[splitedArr.length - 1].split("?")[0];
};

module.exports = { verifyTelegramChatTask };
