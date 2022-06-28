"use strict";
/**
 * User.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const _ = require("lodash");
const { generateRandomNonce } = require("../../../helpers/wallet-helper");

/**
 * Create projectOwner record related to new user record
 * @param {*} user
 * @returns
 */
const createProjectOwner = async (user) => {
  const { id, username, avatar } = user;
  const newProjectOwner = {
    name: username,
    status: "active",
    user: id,
    nonce: generateRandomNonce(),
    metadata: {
      avatar,
    },
  };
  const createdProjectOwner = await strapi.services["project-owner"].create(
    newProjectOwner
  );
  return createdProjectOwner;
};

/**
 * Create hunter record related to new user record
 * @param {User} user
 * @returns hunter record
 */
const createHunter = async (user) => {
  const { referrerCode, id, username, referralCode, avatar } = user;
  const campaign = await strapi.services.campaign.findOne({
    code: referrerCode,
  });
  let newHunter;
  if (!_.isEmpty(campaign)) {
    newHunter = {
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
    };
  } else {
    let root = "######";
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
    newHunter = {
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
    };
  }
  const createdHunter = await strapi.services.hunter.create(newHunter);
  return createdHunter;
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

  /**
   * Create hunter or projectOwner related to created user
   * If userType is voting, check projectOwner
   * Else check for hunter
   * @param {*} userType voting or undefined
   * @param {*} user created user
   */
  async createHunterOrProjectOwner(userType, user) {
    let result = null;
    if (userType === "voting") {
      const projectOwner = await strapi.services["project-owner"].find({
        user: user.id,
        _limit: 1,
      });
      if (_.isEmpty(projectOwner)) {
        result = await createProjectOwner(user);
      }
    } else {
      const hunter = await strapi.services.hunter.find({
        user: user.id,
        _limit: 1,
      });
      if (_.isEmpty(hunter)) {
        result = await createHunter(user);
      }
      return result;
    }
  },
};
