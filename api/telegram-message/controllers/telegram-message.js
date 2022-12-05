"use strict";
const _ = require("lodash");
const moment = require("moment");
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
  await strapi.services["telegram-bot-log"].create({
    log: "Check existed telegram id",
    jsonLog: {
      telegramId: telegramId,
    },
    userId: telegramId,
    type: "existedTelegramId",
    partnerPlatform: ctx.params["partnerPlatform"],
  });
  return (
    (await strapi.query("user", "users-permissions").count({ telegramId })) > 0
  );
};

const findHunter = async (ctx) => {
  const { referralCode } = ctx.params;
  const hunter = await strapi.services.hunter.findOne({ referralCode });
  if (!hunter) {
    await strapi.services["telegram-bot-log"].create({
      log: "Find hunter",
      jsonLog: {
        referralCode: referralCode,
      },
      type: "findHunter",
      partnerPlatform: ctx.params["partnerPlatform"],
    });
    return {};
  }
  await strapi.services["telegram-bot-log"].create({
    hunter: hunter.id,
    log: "Find hunter",
    jsonLog: {
      id: hunter.id,
      userId: _.get(hunter, "user.id"),
      referrerCode: hunter.referrerCode,
      telegramId: _.get(hunter, "user.telegramId"),
      referralCode,
    },
    type: "findHunter",
    partnerPlatform: ctx.params["partnerPlatform"],
  });
  return {
    id: hunter.id,
    userId: _.get(hunter, "user.id"),
    referrerCode: hunter.referrerCode,
    telegramId: _.get(hunter, "user.telegramId"),
  };
};
const createMsg = async (ctx) => {
  try {
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
    await strapi.services["telegram-bot-log"].create({
      userId: `${userId}`,
      chatId: `${chatId}`,
      text,
      authorUsername,
      chatUsername,
      messageId: `${messageId}`,
      date: moment(date * 1000).toISOString(),
      partnerPlatform: ctx.params["partnerPlatform"],
      log: "Create new message",
      type: "createMsg",
    });
    return {
      code: 200,
      status: true,
    };
  } catch (error) {
    return {
      code: 500,
      status: false,
    };
  }
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
  await strapi.services["telegram-bot-log"].create({
    userId: telegramId,
    hunter: id,
    log: "Update hunter",
    jsonLog: {
      telegramId: telegramId,
      referralCode: referralCode,
      referrerCode: referrerCode,
    },
    type: "updateHunter",
    partnerPlatform: ctx.params["partnerPlatform"],
  });
};

module.exports = {
  countId,
  findHunter,
  createMsg,
  updateHunter,
  existedTelegramId,
};
