const VotingPoolModel = require("./index");
const moment = require("moment");

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const createVotingPool = async (params) => {
  const votingPool = await VotingPoolModel.findOne({
    poolId: params.poolId,
  });
  if (!votingPool || !votingPool.id) {
    await VotingPoolModel.create(params);
  }
};

module.exports = {
  createVotingPool,
};
