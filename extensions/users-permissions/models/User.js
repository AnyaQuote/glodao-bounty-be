"use strict";
const _ = require("lodash");
const { generateRandomNonce } = require("../../../helpers/wallet-helper");
const EMPTY_CODE = "######";

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
  lifecycles: {
    // Called after an entry is created
    async afterCreate(result) {
      const { referrerCode, id, username, referralCode, avatar, userType } =
        result;
      if (userType === "voting") return;

      try {
        const campaign = await strapi.services.campaign.findOne({
          code: referrerCode,
        });
        if (campaign) {
          await strapi.services.hunter.create({
            name: username,
            status: "active",
            user: id,
            nonce: generateRandomNonce(),
            referralCode,
            referrerCode: campaign.owner.referralCode,
            campaignCode: campaign.code,
            hunterRole: "user",
            root: campaign.owner.referralCode,
            metadata: {
              avatar,
            },
          });
        } else {
          let root = EMPTY_CODE;
          let campaignCode = "######";
          if (referrerCode !== EMPTY_CODE) {
            const referrer = await strapi.services.hunter.findOne({
              referralCode: referrerCode,
            });
            if (!_.isEmpty(referrer)) {
              root = referrer.root;
              campaignCode = referrer.campaignCode;
            }
          }
          await strapi.services.hunter.create({
            name: username,
            status: "active",
            user: id,
            nonce: generateRandomNonce(),
            referralCode,
            referrerCode,
            campaignCode: campaignCode,
            hunterRole: "user",
            root: root,
            metadata: {
              avatar,
            },
          });
        }
      } catch (error) {
        await strapi.query("user", "users-permissions").delete({ id });
        throw new Error(
          "[INFO]Cannot create user right now. Please try again!"
        );
      }
    },

    async afterDelete(result) {
      await strapi.services.hunter.delete({ id: result.hunter.id });
    },
  },
};
