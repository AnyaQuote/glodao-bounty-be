const { isNumber } = require("lodash");
const Web3 = require("web3");

const getChainConfig = (chainId) => {
  chainId = isNumber(chainId) ? +chainId : chainId;
  let rpc = "";
  let name = "";
  let explorer = "";
  switch (chainId) {
    case 1:
    case "eth":
      name = "Ethereum Mainnet";
      rpc =
        "https://speedy-nodes-nyc.moralis.io/d2e931da4619b9acf870755d/eth/mainnet";
      explorer = "https://etherscan.io/";
      break;
    case 3:
      name = "Ropsten Test Network";
      rpc =
        "https://eth-ropsten.alchemyapi.io/v2/4szhG-FVK337Gq63VnnPoB3VH2BLYIQE";
      explorer = "https://ropsten.etherscan.io/";
      break;
    case 56:
    case "bsc":
      name = "BSC MainNET";
      rpc = "https://bsc-dataseed.binance.org";
      explorer = "https://bscscan.com/";
      break;
    case 97:
      name = "BSC TestNET";
      rpc = "https://data-seed-prebsc-1-s1.binance.org:8545/";
      explorer = "https://testnet.bscscan.com/";
      break;
    case 103:
      name = "Solana DevNET";
      rpc = "https://api.devnet.solana.com";
      explorer = "https://solscan.io/";
      break;
    case 102:
      name = "Solana TestNET";
      rpc = "https://api.testnet.solana.com";
      explorer = "https://solscan.io/";
      break;
    case 101:
      name = "Solana MainNET";
      rpc = getSolanaMainNetRpc();
      explorer = "https://solscan.io/";
      break;
  }
  return { rpc, name, explorer };
};
const getSolanaMainNetRpc = () => {
  return process.env.NODE_ENV === "production"
    ? "https://lively-snowy-violet.solana-mainnet.quiknode.pro/327065b3a0efb376a35b57d1a13d4381ed8ddec0/"
    : "https://solana-api.projectserum.com";
};
const getWeb3 = (chainId) => {
  chainId = isNumber(chainId) ? +chainId : chainId;
  const { rpc } = getChainConfig(chainId);
  if (rpc) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc));
    web3.chainId = chainId;
    return web3;
  } else return null;
};

module.exports = {
  getChainConfig,
  getWeb3,
  ETHER_ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  getSolanaMainNetRpc,
};
