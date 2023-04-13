const axios = require("axios");

const validateBridge = async (walletAddress) => {
  const { data } = await axios.get(`http://13.214.197.173/kyberswap/bridge`, {
    params: { walletAddress },
  });
  console.log(data);
  return data.data.length > 0;
};

const validateLiquidity = async (walletAddress, pairs) => {
  console.log(walletAddress)
  console.log(pairs)
  const { data } = await axios.get(
    `http://13.214.197.173/kyberswap/liquidity`,
    { params: { walletAddress, pairs: pairs.toString() } }
  );
  return data?.totalLiquidityPositions > 0;
};

const validateSwap = async (walletAddress, pairs) => {
  console.log(walletAddress)
  console.log(pairs)
  const { data } = await axios.get(
    `http://13.214.197.173/kyberswap/swaps`,
    { params: { walletAddress, pairs: pairs.toString() } }
  );
  return data?.numberOfTrade > 0;
};

module.exports = {
  validateBridge,
  validateLiquidity,validateSwap
};
