"use strict";

/**
 * User.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const _ = require("lodash");

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
};
