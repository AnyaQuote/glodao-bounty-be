"use strict";
const { generateRandomNonce } = require("../../../helpers/wallet-helper");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const updateProjectOwnerAddress = async (id, walletAddress) => {
  return await strapi.services["project-owner"].update(
    { id },
    {
      address: walletAddress,
    }
  );
};

const updateNonce = async (id) => {
  return await strapi.services["project-owner"].update(
    { id },
    {
      nonce: generateRandomNonce(),
    }
  );
};

module.exports = {
  updateNonce,
  updateProjectOwnerAddress,
};
