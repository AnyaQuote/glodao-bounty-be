"use strict";
const { generateRandomNonce } = require("../../../helpers/wallet-helper");
const { isEqual, get } = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const updateUserToken = async (userId, accessToken, accessTokenSecret) => {
  return await strapi.query("user", "users-permissions").update(
    { id: userId },
    {
      accessToken: accessToken,
      accessTokenSecret: accessTokenSecret,
    }
  );
};

const updateUserDiscordId = async (userId, discordId) => {
  return await strapi.query("user", "users-permissions").update(
    { id: userId },
    {
      discordId,
    }
  );
};

const updateUserDiscordIdByHunter = async (hunterId, discordId) => {
  const user = await strapi.services.hunter.findOne({ id: hunterId });
  return await strapi.query("user", "users-permissions").update(
    { id: user.id },
    {
      discordId,
    }
  );
};

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
    }
  );
};

/**
 * Update hunter's participationStatus with hunter id to new status
 * @param {string} id hunter id
 * @param {string} status new status
 * @returns {Promise} updated hunter
 */
const updateHunterParticipationStatus = async (id, status) => {
  return await strapi.services.hunter.update(
    { id },
    { participationStatus: status }
  );
};

/**
 * Update hunter's participationStatus with id to newbie status
 * @param {string} id hunter id
 * @returns {Promise} updated hunter
 */
const updateHunterStatusToNewbie = async (id) => {
  return await updateHunterParticipationStatus(id, "newbie");
};

/**
 * Check if a wallet address matched with the registered address of the hunter
 * @param {string} hunterId Hunter id
 * @param {string} walletAddress Wallet address
 * @returns True if the wallet address matched with registered address of the hunter, else false
 */
const isPreRegisteredWalletMatched = async (hunterId, walletAddress) => {
  const hunter = await strapi.services.hunter.findOne({ id: hunterId });
  return isEqual(get(hunter, "address", ""), walletAddress);
};

module.exports = {
  updateHunterNonce,
  updateHunterWalletAddress,
  isPreRegisteredWalletMatched,
  updateHunterStatusToNewbie,
  updateUserToken,
  updateUserDiscordId,
  updateUserDiscordIdByHunter,
};
