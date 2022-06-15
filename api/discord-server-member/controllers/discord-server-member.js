"use strict";
const { get, isEqual, isEmpty } = require("lodash");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  updateHunterDiscordId: async (ctx) => {
    try {
      const { referralCode, discordId } = get(ctx, "request.body", {});
      if (isEmpty(referralCode) || isEmpty(discordId))
        return {
          status: false,
          code: 400,
          error: "The following fields are required: referralCode, discordId",
        };

      const hunter = await strapi.services.hunter.findOne({ referralCode });
      if (isEmpty(hunter))
        return {
          status: false,
          error: "Invalid ref link",
          code: 400,
        };

      if (!isEmpty(get(hunter, "user.discordId", "")))
        return {
          status: false,
          code: 409,
          error:
            "This account had been linked with a Discord account already\nIf you own the linked account, please contact GloDAO technical support for help",
        };

      const updatedHunter = await strapi.services.hunter.updateUserDiscordId(
        hunter.user.id,
        discordId
      );

      return {
        status: true,
        data: updatedHunter,
        code: 200,
      };
    } catch (error) {
      return {
        status: false,
        error,
        code: 500,
      };
    }
  },
  addGuildMember: async (ctx) => {
    try {
      const { guildId, userId } = get(ctx, "request.body", {});
      if (!guildId || !userId)
        return {
          status: false,
          code: 400,
          error: "The following fields are required: guildId, userId",
        };

      const existedRecord = await strapi.services[
        "discord-server-member"
      ].findOne({ guildId, userId });
      if (existedRecord)
        return {
          status: false,
          code: 409,
          error: "This record is already existed",
        };

      const record = await strapi.services["discord-server-member"].create({
        guildId,
        userId,
      });

      return {
        status: true,
        code: 200,
        data: record,
      };
    } catch (error) {
      console.log(error);
      return {
        status: false,
        error,
        code: 500,
      };
    }
  },
  removeGuildMember: async (ctx) => {
    try {
      const { guildId, userId } = get(ctx, "request.body", {});
      if (!guildId || !userId)
        return {
          status: false,
          code: 400,
          error: "The following fields are required: guildId, userId",
        };

      const existedRecord = await strapi.services[
        "discord-server-member"
      ].findOne({ guildId, userId });
      if (!existedRecord)
        return {
          status: false,
          code: 409,
          error: "This record is not existed",
        };

      await strapi.services["discord-server-member"].delete({
        guildId,
        userId,
      });

      return {
        status: true,
        code: 200,
      };
    } catch (error) {
      return {
        status: false,
        error,
        code: 500,
      };
    }
  },
};
