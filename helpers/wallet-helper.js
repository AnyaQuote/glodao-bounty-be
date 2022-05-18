const { recoverPersonalSignature } = require("@metamask/eth-sig-util");
const { bufferToHex } = require("ethereumjs-util");
const Web3 = require("web3");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Check if a specific wallet address is solidity address
 * @param {string} address wallet address
 * @returns true - the wallet address is a solidity address
 */
const isSolidityAddress = (address) => {
  return Web3.utils.isAddress(address);
};

/**
 * Check if a wallet address match signed signature
 * @param {string} walletAddress wallet address
 * @param {string} signature wallet signature
 * @param {number} nonce nonce number
 * @returns true - the wallet address match the signature
 */
const verifySoliditySignature = (walletAddress, signature, nonce) => {
  const msg = `GloDAO wants to: \n Sign message with account \n ${walletAddress} - One time nonce: ${nonce}`;
  const msgBufferHex = bufferToHex(Buffer.from(msg, "utf8"));
  const address = recoverPersonalSignature({
    data: msgBufferHex,
    signature: signature,
  });
  return address.toLowerCase() === walletAddress.toLowerCase();
};

/**
 * Generate random nonce number
 * @returns A random nonce number
 */
const generateRandomNonce = () => {
  return Math.floor(Math.random() * 1000000) + "";
};

module.exports = {
  generateRandomNonce,
  isSolidityAddress,
  verifySoliditySignature,
};
