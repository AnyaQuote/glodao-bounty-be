"use strict";
const { generateRandomNonce } = require("../../../helpers/wallet-helper");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Update nonce of a hunter
 * @param {hunter} hunter hunter that need to be updated
 * @returns updated hunter
 */
const updateHunterNonce = async (hunter) => {
  return await strapi.services.hunter.update(
    { id: hunter.id },
    {
      nonce: generateRandomNonce(),
    }
  );
};

/**
 * Update wallet address of a hunter and regenerate a random nonce
 * @param {hunter} hunter hunter that need to be updated
 * @param {string} walletAddress new wallet address
 * @returns updated hunter
 */
const updateHunterWalletAddress = async (hunter, walletAddress) => {
  return await strapi.services.hunter.update(
    { id: hunter.id },
    {
      address: walletAddress,
      nonce: generateRandomNonce(),
    }
  );
};

module.exports = {
  updateHunterNonce,
  updateHunterWalletAddress,
};
