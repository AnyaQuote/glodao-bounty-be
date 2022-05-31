require("dotenv").config();

const { Telegraf } = require("telegraf");
const { setupStrapi } = require("../../helpers/strapi-helper");
const _ = require("lodash");
const MESSAGES = require("./messages");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API_TOKEN);

const HTTP_URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const URL_REGEX =
  /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const HOST = process.env.WEB_HOST;

const main = async () => {
  await setupStrapi();
  console.log("Strapi ready");
  console.log(strapi.config.database.connections);
  console.log(strapi.config.connections);
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

  bot.start((ctx) => {
    const { from } = ctx.message;
    console.log("------ Start ------");
    console.log(from);
    return ctx.replyWithMarkdown(
      `Hello [${
        from.username || from.first_name || from.last_name
      }](tg://user?id=${
        from.id
      })\nIf you come from our Bounty app, you can link your account here for Telegram task validation!
    `
    );
  });

  bot.help((ctx) => ctx.replyWithHTML(MESSAGES.HELP_MESSAGE));

  bot.command("easteregg", (ctx) =>
    ctx.reply("You have found the easter egg!!! But it does not have any yet")
  );

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
      if (host !== HOST || !searchParams || !searchParams.get("ref"))
        return ctx.reply(MESSAGES.INVALID_REF_URL_ERROR);

      const referralCode = searchParams.get("ref");

      // Check if this telegram id had been used
      const isUsedTelegramId =
        (await strapi
          .query("user", "users-permissions")
          .count({ telegramId })) > 0;
      if (isUsedTelegramId) return ctx.reply(MESSAGES.ALREADY_LINKED_ERROR);

      const hunter = await strapi.services.hunter.findOne({ referralCode });
      if (_.isEmpty(hunter)) return ctx.reply(MESSAGES.INVALID_REF_LINK_ERROR);

      if (!_.isEmpty(_.get(hunter, "user.telegramId", "")))
        return ctx.reply(
          "This account had been linked with a Telegram account already\nIf you own the linked Telegram account, use /unlink command to unlink the account"
        );

      await strapi.query("user", "users-permissions").update(
        { id: hunter.user.id },
        {
          telegramId,
          referralCode,
          referrerCode: hunter.referrerCode,
        }
      );
      return ctx.reply(MESSAGES.LINK_SUCCESS, {
        reply_to_message_id: ctx.message.message_id,
      });
    } catch (error) {
      console.log(error);
      return ctx.reply(MESSAGES.UNKNOWN_ERROR, {
        reply_to_message_id: ctx.message.message_id,
      });
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

      const linkedUser = await strapi
        .query("user", "users-permissions")
        .findOne({ telegramId });

      if (_.isEmpty(linkedUser))
        return ctx.reply(MESSAGES.NOT_LINKED_ERROR, {
          reply_to_message_id: ctx.message.message_id,
        });

      await strapi.query("user", "users-permissions").update(
        { id: linkedUser.id },
        {
          telegramId: "",
        }
      );

      return ctx.reply(MESSAGES.UNLINK_SUCCESS, {
        reply_to_message_id: ctx.message.message_id,
      });
    } catch (error) {
      console.log(error);
      return ctx.reply(MESSAGES.UNKNOWN_ERROR, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  });

  bot.on("new_chat_members", async (ctx) => {
    const { new_chat_participant, new_chat_member, new_chat_members } =
      ctx.message;
    console.log("------ New member ------");
    console.log(new_chat_member);
    return ctx.replyWithMarkdown(
      `Hello [${
        new_chat_member.username ||
        new_chat_member.first_name ||
        new_chat_member.last_name
      }](tg://user?id=${
        new_chat_member.id
      })\nIf you come from our Bounty app, you can link your account here for Telegram task validation!
      `
    );
  });
};

main();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
