"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  updateProjectOwnerAddress: async (ctx) => {
    const { walletAddress, id } = ctx.request.body;
    return await strapi.services["project-owner"].updateProjectOwnerAddress(
      id,
      walletAddress
    );
  },
};
