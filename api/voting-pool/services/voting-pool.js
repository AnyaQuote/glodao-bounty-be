"use strict";
const {
  getPoolInfo,
} = require("../../../helpers/blockchainHelpers/voting-helper");

const checkIsOwner = (ctx, ownerAddress) => {
  if (ctx.state.user.username !== ownerAddress)
    return ctx.forbidden(`You can not update this entry`);
};

const createVotingPool = async (ctx, votingPoolData) => {
  // 1. check contract has poolId
  // 2. check ctx.state.user.username == poolContract.ownerAddress
  const poolInfo = await getPoolInfo(votingPoolData.poolId);
  if (poolInfo && poolInfo.owner && ctx.state.user.username == poolInfo.owner) {
    // check votingPool exist
    const votingPool = await strapi.services["voting-pool"].findOne({
      poolId: votingPoolData.poolId,
    });
    let pool;
    if (votingPool && votingPool.id) {
      votingPoolData.data = {
        ...votingPool.data,
        ...votingPoolData.data,
      };
      pool = await updateVotingPool(votingPoolData, votingPool.id);
    } else {
      pool = await strapi.services["voting-pool"].create({
        projectName: votingPoolData.projectName,
        type: votingPoolData.type,
        status: votingPoolData.status,
        startDate: votingPoolData.startDate,
        endDate: votingPoolData.endDate,
        data: votingPoolData.data,
      });
    }
  }

  const pool = await strapi.services["voting-pool"].create(votingPoolData);
  return pool;
};

const updateVotingPool = async (votingPoolData, votingPooId) => {
  const pool = await strapi.services["voting-pool"].update(
    {
      id: votingPooId,
    },
    {
      projectName: votingPoolData.projectName,
      type: votingPoolData.type,
      status: votingPoolData.status,
      startDate: votingPoolData.startDate,
      endDate: votingPoolData.endDate,
      data: votingPoolData.data,
    }
  );

  return pool;
};

const createOrUpdateVotingPool = async (ctx, votingPoolData) => {
  const votingPool = await strapi.services["voting-pool"].findOne({
    poolId: votingPoolData.poolId,
  });
  checkIsOwner(ctx, votingPoolData.ownerAddress);

  let pool;
  if (votingPool && votingPool.id) {
    votingPoolData.data = {
      ...votingPool.data,
      ...votingPoolData.data,
    };
    pool = await updateVotingPool(votingPoolData, votingPool.id);
  } else {
    pool = await createVotingPool(ctx, votingPoolData);
  }

  return pool;
};

module.exports = {
  createOrUpdateVotingPool,
};
