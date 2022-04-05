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
      const { referrerCode, id, username, referralCode, avatar } = result;

      const res = await strapi.services.hunter.create({
        name: username,
        status: "active",
        user: id,
        nonce: generateRandomNonce(),
        referralCode,
        referrerCode,
        metadata: {
          avatar,
        },
      });
      console.log(res);
    },
  },
};
