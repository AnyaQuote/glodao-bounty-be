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

const updateStatusVotingPool = async (poolId) => {
  const votingPool = await VotingPoolModel.findOne({
    poolId,
  });
  if (votingPool && votingPool.id) {
    try {
      await VotingPoolModel.update(
        { id: votingPool.id },
        {
          status: "approved",
        }
      );
    } catch (error) {
      console.log("--- updateStatusVotingPool error: ", error);
    }
  }
};

const cancelVotingPool = async (poolId) => {
  const votingPool = await VotingPoolModel.findOne({
    poolId,
  });
  if (votingPool && votingPool.id) {
    try {
      await VotingPoolModel.update(
        { id: votingPool.id },
        {
          status: "cancelled",
        }
      );
    } catch (error) {
      console.log("--- cancelVotingPool error: ", error);
    }
  }
};

module.exports = {
  createVotingPool,
  updateStatusVotingPool,
  cancelVotingPool,
};
