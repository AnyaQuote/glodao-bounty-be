/**
 * Get transaction details from blockchain
 * @param {string} tx transaction hash
 * @param {Web3} web3 web3 instance
 * @returns {Promise} transaction detail
 */
const getTransactionDetail = async (tx, web3) => {
  return await web3.eth.getTransaction(tx);
};

/**
 * Get transaction receipt from blockchain with tx hash
 * @param {string} tx transaction hash
 * @param {Web3} web3 web3 instance
 * @returns {Promise} transaction receipt
 */
const getTransactionReceipt = async (tx, web3) => {
  return await web3.eth.getTransactionReceipt(tx);
};

module.exports = {
  getTransactionDetail,
  getTransactionReceipt,
};
