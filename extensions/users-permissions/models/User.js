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
      const { referrerCode, id, username, referralCode, avatar } = result;
      try {
        let root = EMPTY_CODE;
        let hunter_role = "user";
        if (referrerCode !== EMPTY_CODE) {
          const referrer = await strapi.services.hunter.findOne({
            referralCode: referrerCode,
          });
          if (!_.isEmpty(referrer)) {
            hunter_role = referrer.hunterRole === "company" ? "KOL" : "user";
            root = referrer.root;
          }
        }
        const res = await strapi.services.hunter.create({
          name: username,
          status: "active",
          user: id,
          nonce: generateRandomNonce(),
          referralCode,
          referrerCode,
          hunterRole: hunter_role,
          root: root,
          metadata: {
            avatar,
          },
        });
        return res;
      } catch (error) {
        const res = await strapi
          .query("user", "users-permissions")
          .delete({ id });
        throw new Error(
          "[INFO]Cannot create user right now. Please try again!"
        );
      }
    },
  },
};
