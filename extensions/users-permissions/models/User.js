"use strict";
const _ = require("lodash");
const { generateRandomNonce } = require("../../../helpers/wallet-helper");

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
  lifecycles: {
    // Called after an entry is created
    async afterCreate(result) {
      const { referrerCode, id, username } = result;

      await strapi.services.hunter.create({
        name: username,
        status: "active",
        user: id,
        nonce: generateRandomNonce(),
      });

      if (_.isEqual(referrerCode, "######")) return;

      const referrer = await strapi.plugins[
        "users-permissions"
      ].services.user.getUserByReferralCode(referrerCode);

      if (!referrer) return;

      await strapi.plugins[
        "users-permissions"
      ].services.user.addToUserReferralList(referrer, id);
    },
  },
};
