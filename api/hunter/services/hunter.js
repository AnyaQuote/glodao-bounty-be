"use strict";
const { generateRandomNonce } = require("../../../helpers/wallet-helper");
const { isEqual, get } = require("lodash");

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

/**
 * Check if a wallet address matched with the registered address of the hunter
 * @param {string} hunterId Hunter id
 * @param {string} walletAddress Wallet address
 * @returns True if the wallet address matched with registered address of the hunter, else false
 */
const isPreRegisteredWalletMatched = async (hunterId, walletAddress) => {
  const hunter = await strapi.services.hunter.findOne({ id: hunterId });
  return isEqual(get(hunter, "address"), walletAddress);
};

module.exports = {
  updateHunterNonce,
  updateHunterWalletAddress,
  isPreRegisteredWalletMatched,
};
