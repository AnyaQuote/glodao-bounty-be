"use strict";
const _ = require("lodash");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const countId = async (ctx) => {
  const { telegramId } = ctx.params;
  return await strapi.query("user", "users-permissions").count({ telegramId });
};

const existedTelegramId = async (ctx) => {
  const { telegramId } = ctx.params;
  return (
    (await strapi.query("user", "users-permissions").count({ telegramId })) > 0
  );
};

const findHunter = async (ctx) => {
  const { referralCode } = ctx.params;
  const hunter = await strapi.services.hunter.findOne({ referralCode });
  if (!hunter) return {};
  return {
    id: hunter.id,
    userId: _.get(hunter, "user.id"),
    referrerCode: hunter.referrerCode,
    telegramId: _.get(hunter, "user.telegramId"),
  };
};
const createMsg = async (ctx) => {
  const {
    userId,
    chatId,
    text,
    authorUsername,
    chatUsername,
    messageId,
    date,
  } = ctx.request.body;
  await strapi.services["telegram-message"].create({
    userId: `${userId}`,
    chatId: `${chatId}`,
    text,
    authorUsername,
    chatUsername,
    messageId: `${messageId}`,
    date: moment(date * 1000).toISOString(),
  });
};

const updateHunter = async (ctx) => {
  const { id } = ctx.params;
  const { telegramId, referralCode, referrerCode } = ctx.request.body;
  await strapi.query("user", "users-permissions").update(
    { id },
    {
      telegramId,
      referralCode,
      referrerCode,
    }
  );
};

module.exports = {
  countId,
  findHunter,
  createMsg,
  updateHunter,
  existedTelegramId,
};
