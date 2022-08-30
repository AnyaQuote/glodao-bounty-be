"use strict";
const { isEmpty } = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

/**
 * Record donation
 * @param {Context} ctx context
 * @returns new record
 */
const recordDonation = async (ctx) => {
  const { tx, username } = ctx.request.body;
  if (isEmpty(tx)) return ctx.badRequest(null, "Transaction hash is required");
  if (isEmpty(username)) return ctx.badRequest(null, "Username is required");

  return await strapi.services["donation-transaction"].recordDonation(
    tx,
    username
  );
};

module.exports = {
  recordDonation,
};
