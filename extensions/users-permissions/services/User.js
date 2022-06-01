"use strict";
const { generateRandomNonce } = require("../../../helpers/wallet-helper");
const EMPTY_CODE = "######";

/**
 * User.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const _ = require("lodash");

const createProjectOwner = async (user) => {
  const { referrerCode, id, username, referralCode, avatar } = user;
  const projectOwner = await strapi.services["project-owner"].create({
    name: username,
    status: "active",
    user: id,
    nonce: generateRandomNonce(),
    metadata: {
      avatar,
    },
  });
  return projectOwner;
};

const createHunter = async (user) => {
  const { referrerCode, id, username, referralCode, avatar } = user;
  const campaign = await strapi.services.campaign.findOne({
    code: referrerCode,
  });
  let hunter;
  if (campaign) {
    hunter = await strapi.services.hunter.create({
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
    hunter = await strapi.services.hunter.create({
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

    return hunter;
  }
};

module.exports = {
  /**
   * Promise to update referrer's referral list
   * @param {user} referrer The user who is the referrer
   * @param {string} id Id of the user who was referred by the referrer
   * @return {Promise}
   */
  async addToUserReferralList(referrer, id) {
    return await strapi.query("user", "users-permissions").update(
      { id: referrer.id },
      {
        referralList: [...(_.get(referrer, "referralList", []) || []), id],
      }
    );
  },

  /**
   * Find user by referral code
   * @param {string} referralCode User's referral code
   * @returns {user}
   */
  async getUserByReferralCode(referralCode) {
    return await strapi.query("user", "users-permissions").findOne({
      referralCode,
    });
  },

  /**
   * Check if a referral code is valid
   * @param {string} ref referral code
   * @returns {Promise} True if ref is exist, else false
   */
  async isRefExist(ref) {
    return (await strapi.services.hunter.count({ referralCode: ref })) > 0;
  },
  createProjectOwner,
  createHunter,
};
