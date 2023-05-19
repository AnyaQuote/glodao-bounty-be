require("dotenv").config();
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const { Telegraf } = require("telegraf");
const { setupStrapi } = require("../../helpers/strapi-helper");
const _ = require("lodash");
const moment = require("moment");
const MESSAGES = require("./messages");
const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);
const bot = new Telegraf(argv.token);
const axios = require("axios");

const HTTP_URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const URL_REGEX =
  /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const HOST = argv.webHost || process.env.WEB_HOST;
const API_HOST = argv.apiHost || process.env.API_HOST;
const PARTNER_API_KEY = argv.partnerKey || process.env.PARTNER_API_KEY;
console.log(HOST);
console.log(API_HOST);
console.log(PARTNER_API_KEY);
const main = async () => {
  // await setupStrapi();
  // console.log("Strapi ready");
  // console.log(strapi.config.database.connections);
  // console.log(strapi.config.connections);
  setupBot();
  console.log("Bot Ready");

  bot.launch();
};

const setupBot = () => {
  bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
  });

  bot.use(async (ctx, next) => {
    console.time(`Processing update ${ctx.update.update_id}`);
    await next();
    // runs after next middleware finishes
    console.timeEnd(`Processing update ${ctx.update.update_id}`);
  });

  bot.start(async (ctx) => {
    try {
      const { from, text } = ctx.message;
      console.log("------ Start ------");
      console.log(ctx);
      console.log(ctx.message.entities);

      console.log(from);
      await ctx.replyWithMarkdown(
        `Hello [${
          from.username || from.first_name || from.last_name
        }](tg://user?id=${
          from.id
        })\nIf you come from our Bounty app, you can paste your referral link here to link your account.\nFor more information, you can use /help
  `
      );
      if (_.isEqual(text.trim(), "/start")) return;

      const splitedArr = _.split(text.trim(), /\s+/, 2);

      console.log(splitedArr);
      if (splitedArr.length < 2) return;
      const referralCode = splitedArr[1];
      if (_.size(referralCode) !== 6) return;
      await sleep(1000);
      await ctx.reply("Detect user from bounty app!\nProcessing ...");
      await sleep(1000);
      const telegramId = _.get(ctx, "message.from.id", "");
      if (!telegramId) return ctx.reply(MESSAGES.UNKNOWN_ERROR);
      console.log(ctx.message);
      console.log(telegramId, _.get(ctx, "message.from.username", ""));

      // const isUsedTelegramId =
      //   (await strapi
      //     .query("user", "users-permissions")
      //     .count({ telegramId })) > 0;
      const { data: isUsedTelegramId } = await axios.get(
        `${API_HOST}/telegram-messages/existedTelegramId/${telegramId}?PARTNER_API_KEY=${PARTNER_API_KEY}`
      );
      console.log(isUsedTelegramId);
      if (isUsedTelegramId) return ctx.reply(MESSAGES.ALREADY_LINKED_ERROR);

      // const hunter = await strapi.services.hunter.findOne({ referralCode });

      // const hunter =
      // GET
      // /telegram-messages/findHunter/:referralCode
      // return hunter: {
      // id,
      // userId,
      // referrerCode,
      // telegramId,
      //}
      const { data: hunter } = await axios.get(
        `${API_HOST}/telegram-messages/findHunter/${referralCode}?PARTNER_API_KEY=${PARTNER_API_KEY}`
      );
      if (_.isEmpty(hunter)) return ctx.reply(MESSAGES.INVALID_REF_LINK_ERROR);

      if (!_.isEmpty(_.get(hunter, "user.telegramId", "")))
        return ctx.reply(
          "This account had been linked with a Telegram account already\nIf you own the linked Telegram account, use /unlink command to unlink the account"
        );

      // await strapi.query("user", "users-permissions").update(
      //   { id: hunter.userId },
      //   {
      //     telegramId,
      //     referralCode,
      //     referrerCode: hunter.referrerCode,
      //   }
      // );
      // Update hunter telegram id
      // PATCH
      // /telegram-messages/updateHunter/:id
      // Request body:
      // {
      // telegramId, referralCode, referrerCode:hunter.referrerCode
      // }

      const { data } = await axios.patch(
        `${API_HOST}/telegram-messages/updateHunter/${hunter.userId}?PARTNER_API_KEY=${PARTNER_API_KEY}`,
        {
          telegramId,
          referralCode,
          referrerCode: hunter.referrerCode,
        }
      );
      if (data.status)
        return ctx.reply(
          "Link account successfully! You can process Telegram task from now on",
          {
            reply_to_message_id: ctx.message.message_id,
          }
        );
    } catch (error) {
      console.log(error);
      // return ctx.reply(MESSAGES.UNKNOWN_ERROR, {
      //   reply_to_message_id: ctx.message.message_id,
      // });
    }
  });

  bot.help((ctx) => {
    try {
      return ctx.replyWithHTML(MESSAGES.HELP_MESSAGE);
    } catch (error) {
      return ctx.reply(error);
    }
  });

  bot.command("easteregg", (ctx) => {
    try {
      ctx.reply(
        "You have found the easter egg!!! But it does not have any yet"
      );
    } catch (error) {
      console.log(error);
    }
  });

  bot.command("link", async (ctx) => {
    try {
      console.log("--- ACCOUNT LINKING ACTION ---");
      // Check if there is a telegram id from message
      const telegramId = _.get(ctx, "message.from.id", "");
      if (!telegramId) return ctx.reply(MESSAGES.UNKNOWN_ERROR);
      console.log(ctx.message);
      console.log(telegramId, _.get(ctx, "message.from.username", ""));
      // Check all url from message
      const urlEntities = ctx.message.entities.filter(
        (entity) => entity.type === "url"
      );
      if (!urlEntities || urlEntities.length !== 1)
        return ctx.reply(MESSAGES.REF_LINK_FORMAT_REQUIRED, {
          reply_to_message_id: ctx.message.message_id,
        });

      // Check ref link valid
      const { searchParams, host } = new URL(
        _.get(ctx, "message.text", "").substring(
          urlEntities[0].offset,
          urlEntities[0].offset + urlEntities[0].length
        )
      );
      if (
        (host !== HOST && host !== "yggsea.io") ||
        !searchParams ||
        !searchParams.get("ref")
      )
        return ctx.reply(MESSAGES.INVALID_REF_URL_ERROR);

      const referralCode = searchParams.get("ref");

      // Check if this telegram id had been used
      // const isUsedTelegramId =
      //   (await strapi
      //     .query("user", "users-permissions")
      //     .count({ telegramId })) > 0;

      const { data: isUsedTelegramId } = await axios.get(
        `${API_HOST}/telegram-messages/existedTelegramId/${telegramId}?PARTNER_API_KEY=${PARTNER_API_KEY}`
      );
      if (isUsedTelegramId) return ctx.reply(MESSAGES.ALREADY_LINKED_ERROR);

      // const hunter = await strapi.services.hunter.findOne({ referralCode });
      const { data: hunter } = await axios.get(
        `${API_HOST}/telegram-messages/findHunter/${referralCode}?PARTNER_API_KEY=${PARTNER_API_KEY}`
      );

      console.log(hunter);
      if (_.isEmpty(hunter)) return ctx.reply(MESSAGES.INVALID_REF_LINK_ERROR);

      if (!_.isEmpty(_.get(hunter, "user.telegramId", "")))
        return ctx.reply(
          "This account had been linked with a Telegram account already\nIf you own the linked Telegram account, use /unlink command to unlink the account"
        );

      // await strapi.query("user", "users-permissions").update(
      //   { id: hunter.userId },
      //   {
      //     telegramId,
      //     referralCode,
      //     referrerCode: hunter.referrerCode,
      //   }
      // );
      const { data } = await axios.patch(
        `${API_HOST}/telegram-messages/updateHunter/${hunter.userId}?PARTNER_API_KEY=${PARTNER_API_KEY}`,
        {
          telegramId,
          referralCode,
          referrerCode: hunter.referrerCode,
        }
      );
      if (data.status)
        return ctx.reply(MESSAGES.LINK_SUCCESS, {
          reply_to_message_id: ctx.message.message_id,
        });
    } catch (error) {
      console.log(error);
      // return ctx.reply(MESSAGES.UNKNOWN_ERROR, {
      //   reply_to_message_id: ctx.message.message_id,
      // });
    }
  });

  bot.command("unlink", async (ctx) => {
    try {
      console.log("--- ACCOUNT UNLINKING ACTION ---");
      // Check if there is a telegram id from message
      const telegramId = _.get(ctx, "message.from.id", "");
      if (!telegramId) return ctx.reply(MESSAGES.UNKNOWN_ERROR);
      console.log(ctx.message);
      console.log(telegramId, _.get(ctx, "message.from.username", ""));

      // const linkedUser = await strapi
      //   .query("user", "users-permissions")
      //   .findOne({ telegramId });

      // if (_.isEmpty(linkedUser))
      //   return ctx.reply(MESSAGES.NOT_LINKED_ERROR, {
      //     reply_to_message_id: ctx.message.message_id,
      //   });

      // await strapi.query("user", "users-permissions").update(
      //   { id: linkedUser.id },
      //   {
      //     telegramId: "",
      //   }
      // );

      // return ctx.reply(MESSAGES.UNLINK_SUCCESS, {
      //   reply_to_message_id: ctx.message.message_id,
      // });
    } catch (error) {
      console.log(error);
      // return ctx.reply(MESSAGES.UNKNOWN_ERROR, {
      //   reply_to_message_id: ctx.message.message_id,
      // });
    }
  });

  bot.on("new_chat_members", async (ctx) => {
    try {
      console.log(ctx.message);
      const {
        new_chat_participant,
        new_chat_member,
        new_chat_members,
        from,
        chat,
      } = ctx.message;
      console.log("------ New member ------");
      console.log(new_chat_member);
      await axios.post(
        `${API_HOST}/telegram-invitations?PARTNER_API_KEY=${PARTNER_API_KEY}`,
        {
          from: `${from.id}`,
          chatId: `${chat.id}`,
          chatName: chat.title,
          to: `${new_chat_member.id}`,
          fullMessage: ctx.message,
          date: moment().toISOString(),
        }
      );
    } catch (error) {
      console.log(error);
    }
  });

  bot.hears(HTTP_URL_REGEX, async (ctx) => {
    try {
      console.log("--- ACCOUNT LINKING ACTION ---");
      // Check if there is a telegram id from message
      const telegramId = _.get(ctx, "message.from.id", "");
      if (!telegramId) return ctx.reply(MESSAGES.UNKNOWN_ERROR);
      console.log(ctx.message);
      console.log(telegramId, _.get(ctx, "message.from.username", ""));

      const urlEntities = ctx.message.entities.filter(
        (entity) => entity.type === "url"
      );
      if (!urlEntities || urlEntities.length !== 1) return;

      // Check ref link valid
      const { searchParams, host } = new URL(
        _.get(ctx, "message.text", "").substring(
          urlEntities[0].offset,
          urlEntities[0].offset + urlEntities[0].length
        )
      );
      if (host !== HOST && host !== "yggsea.io") return;
      if (!searchParams || !searchParams.get("ref"))
        return ctx.reply(MESSAGES.INVALID_REF_URL_ERROR);

      const referralCode = searchParams.get("ref");

      // Check if this telegram id had been used
      // const isUsedTelegramId =
      //   (await strapi
      //     .query("user", "users-permissions")
      //     .count({ telegramId })) > 0;
      const { data: isUsedTelegramId } = await axios.get(
        `${API_HOST}/telegram-messages/existedTelegramId/${telegramId}?PARTNER_API_KEY=${PARTNER_API_KEY}`
      );
      console.log(isUsedTelegramId);

      if (isUsedTelegramId) return ctx.reply(MESSAGES.ALREADY_LINKED_ERROR);

      // const hunter = await strapi.services.hunter.findOne({ referralCode });
      const { data: hunter } = await axios.get(
        `${API_HOST}/telegram-messages/findHunter/${referralCode}?PARTNER_API_KEY=${PARTNER_API_KEY}`
      );
      console.log(hunter);

      if (_.isEmpty(hunter)) return ctx.reply(MESSAGES.INVALID_REF_LINK_ERROR);

      if (!_.isEmpty(_.get(hunter, "user.telegramId", "")))
        return ctx.reply(
          "This account had been linked with a Telegram account already\nIf you own the linked account, please contact technical support for help"
        );

      // await strapi.query("user", "users-permissions").update(
      //   { id: hunter.userId },
      //   {
      //     telegramId,
      //     referralCode,
      //     referrerCode: hunter.referrerCode,
      //   }
      // );
      const { data } = await axios.patch(
        `${API_HOST}/telegram-messages/updateHunter/${hunter.userId}?PARTNER_API_KEY=${PARTNER_API_KEY}`,
        {
          telegramId,
          referralCode,
          referrerCode: hunter.referrerCode,
        }
      );
      console.log(data);
      if (data.status)
        return ctx.reply(MESSAGES.LINK_SUCCESS, {
          reply_to_message_id: ctx.message.message_id,
        });
    } catch (error) {
      console.log(error);
      // return ctx.reply(MESSAGES.UNKNOWN_ERROR, {
      //   reply_to_message_id: ctx.message.message_id,
      // });
    }
  });

  bot.on("message", (ctx) => {
    try {
      const {
        from,
        chat,
        text,
        date,
        message_id: messageId,
      } = _.get(ctx, "message", {});
      const { id: userId, username: authorUsername } = from;
      const { id: chatId, username: chatUsername } = chat;
      console.log(`${authorUsername} send message in ${chatUsername}: ${text}`);
      // strapi.services["telegram-message"]
      //   .create({
      //     userId: `${userId}`,
      //     chatId: `${chatId}`,
      //     text,
      //     authorUsername,
      //     chatUsername,
      //     messageId: `${messageId}`,
      //     date: moment(date * 1000).toISOString(),
      //   })
      //   .catch((error) => {
      //     console.log(error.data.errors, "ohno");
      //   });
      // POST
      // /telegram-messages/createMsg
      //  request body: {
      //       userId: `${userId}`,
      //       chatId: `${chatId}`,
      //       text,
      //       authorUsername,
      //       chatUsername,
      //       messageId: `${messageId}`,
      //       date: moment(date * 1000).toISOString(),
      //}
      axios
        .post(
          `${API_HOST}/telegram-messages/createMsg?PARTNER_API_KEY=${PARTNER_API_KEY}`,
          {
            userId: `${userId}`,
            chatId: `${chatId}`,
            text,
            authorUsername,
            chatUsername,
            messageId: `${messageId}`,
            date: moment(date * 1000).toISOString(),
          }
        )
        .catch((err) => {});
    } catch (error) {
      console.log(error);
    }
  });
};
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
main();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
