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
  const { tx } = ctx.request.body;
  if (isEmpty(tx)) return ctx.badRequest(null, "Transaction hash is required");

  return await strapi.services["donation-transaction"].recordDonation(tx);
};

module.exports = {
  recordDonation,
};
