const Web3 = require("web3");
const { first, isNumber, last } = require("lodash");
const { WalletAdapterNetwork } = require("@solana/wallet-adapter-base");
const { ProgramError, Provider } = require("@project-serum/anchor");
const {
  ConfirmOptions,
  Connection,
  SendTransactionError,
  Wallet,
} = require("@solana/web3.js");
const {
  CLUSTER_SLUGS,
  ENV: SOL_CHAINID,
} = require("@solana/spl-token-registry");
const { clusterApiUrl } = require("@solana/web3.js");
const { FixedNumber } = require("@ethersproject/bignumber");

const getSolanaConfig = (chainId) => {
  const opts = {
    preflightCommitment: "recent",
    commitment: "recent",
  };
  let connection;

  switch (+chainId) {
    case SOL_CHAINID.MainnetBeta:
      connection = new Connection(
        getSolanaMainNetRpc(),
        opts.preflightCommitment
      );
      break;
    case SOL_CHAINID.Testnet:
      connection = new Connection(
        clusterApiUrl(WalletAdapterNetwork.Testnet),
        opts.preflightCommitment
      );
      break;
    case SOL_CHAINID.Devnet:
    default:
      connection = new Connection(
        clusterApiUrl(WalletAdapterNetwork.Devnet),
        opts.preflightCommitment
      );
      break;
  }
  return new Provider(connection, undefined, opts);
};
const getChainConfig = (chainId) => {
  chainId = !isNumber(chainId) ? +chainId : chainId;
  let rpc = "";
  let name = "";
  let ws = "";
  switch (chainId) {
    case 1:
    case "eth":
      name = "Ethereum Mainnet";
      rpc =
        "https://speedy-nodes-nyc.moralis.io/d2e931da4619b9acf870755d/eth/mainnet";
      ws =
        "wss://speedy-nodes-nyc.moralis.io/1d4b28cac6eaaaa2f3c695d6/eth/mainnet/ws";
      // rpc = 'https://cloudflare-eth.com'
      break;
    case 3:
      name = "Ropsten Test Network";
      rpc =
        "https://eth-ropsten.alchemyapi.io/v2/4szhG-FVK337Gq63VnnPoB3VH2BLYIQE";
      ws =
        "wss://speedy-nodes-nyc.moralis.io/1d4b28cac6eaaaa2f3c695d6/eth/ropsten/ws";
      break;
    case 56:
    case "bsc":
      name = "BSC MainNET";
      rpc = "https://bsc-dataseed.binance.org";
      ws =
        "wss://speedy-nodes-nyc.moralis.io/1d4b28cac6eaaaa2f3c695d6/bsc/mainnet/ws";
      break;
    case 97:
      name = "BSC TestNET";
      rpc = "https://data-seed-prebsc-2-s3.binance.org:8545/";
      ws =
        "wss://speedy-nodes-nyc.moralis.io/1d4b28cac6eaaaa2f3c695d6/bsc/testnet/ws";
      // ws = "wss://bsc-ws-node.nariox.org:443";
      break;
    case 103:
      name = "Solana DevNET";
      rpc = "https://api.devnet.solana.com";
      ws = "wss://api.devnet.solana.com/";
      break;
    case 102:
      name = "Solana TestNET";
      rpc = "https://api.testnet.solana.com";
      ws = "wss://api.testnet.solana.com/";
      break;
    case 101:
      name = "Solana MainNET";
      rpc = "https://api.mainnet-beta.solana.com";
      // rpc = "https://solana-api.projectserum.com";
      ws = "wss://api.mainnet-beta.solana.com/";
      break;
  }
  return { rpc, name, ws };
};
const getSolanaMainNetRpc = () => {
  return process.env.NODE_ENV === "production"
    ? "https://lively-snowy-violet.solana-mainnet.quiknode.pro/327065b3a0efb376a35b57d1a13d4381ed8ddec0/"
    : "https://solana-api.projectserum.com";
};
const getWeb3 = (chainId) => {
  chainId = !isNumber(chainId) ? +chainId : chainId;
  const { rpc } = getChainConfig(chainId);
  if (rpc) {
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc));
    web3.chainId = chainId;
    return web3;
  } else return null;
};
const getVotingContractCreation = (chainId) => {
  chainId = +chainId;
  switch (chainId) {
    case 56:
    case "56":
      return {
        transactionHash:
          "0xf858152b53e95148276f92bc596d0e4dd850e5d3132908ba040e835391be407a",
        blockNumber: 19868002,
      };
    case 97:
    case "97":
      return {
        transactionHash:
          "0xf858152b53e95148276f92bc596d0e4dd850e5d3132908ba040e835391be407a",
        blockNumber: 19868002,
      };
  }
};
const getVotingContract = (chainId) => {
  chainId = +chainId;
  switch (chainId) {
    case 101:
    case 103:
    case "101":
    case "103":
      return "";
    case 56:
    case "56":
      return "0x27115b06568443c5000057C7d06A7743201AB507";
    case 97:
    case "97":
      return "0x27115b06568443c5000057C7d06A7743201AB507";
  }
  return null;
};
module.exports = {
  ETHER_ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  getChainConfig,
  getWeb3,
  getSolanaConfig,
  getSolanaMainNetRpc,
  getVotingContract,
  getVotingContractCreation,
};
