"use strict";
const {
  getPoolInfo,
} = require("../../../helpers/blockchainHelpers/voting-helper");

/**
 * Create new voting pool data
 * If contract query found this pool using contract poolId field, peform update pool
 * Else, create new voting pool data
 * @param {object} votingPoolData
 * @returns upserted pool data
 */
const createVotingPool = async (
  ctx,
  votingPoolData,
  ignoreContractCheck = false
) => {
  // 1. check contract has poolId
  let pool;
  if (!ignoreContractCheck) {
    const poolInfo = await getPoolInfo(votingPoolData);

    if (!poolInfo) {
      console.log("should return");
      return ctx.badRequest("Contract can not identify this record");
    }
  }

  const votingPool = await strapi.services["voting-pool"].findOne({
    poolId: votingPoolData.poolId,
    version: votingPoolData.version,
  });
  if (votingPool && votingPool.id) {
    votingPoolData.data = {
      ...votingPool.data,
      ...votingPoolData.data,
    };
    pool = await updateVotingPool(votingPoolData, votingPool.id);
  } else {
    pool = await strapi.services["voting-pool"].create(votingPoolData);
  }

  return pool;
};

/**
 * Update voting pool data
 * @param {object} votingPoolData
 * @param {string} votingPooId strapi id of a voting pool record
 * @returns updated pool data
 */
const updateVotingPool = async (votingPoolData, votingPooId) => {
  const pool = await strapi.services["voting-pool"].update(
    {
      id: votingPooId,
    },
    {
      projectName: votingPoolData.projectName,
      type: votingPoolData.type,
      tokenAddress: votingPoolData.tokenAddress,
      rewardTokenSymbol: votingPoolData.rewardToken,
      status: votingPoolData.status,
      unicodeName: votingPoolData.unicodeName,
      totalMission: votingPoolData.totalMissions || votingPoolData.totalMission,
      // startDate:votingPoolData.startDate ,
      // endDate: votingPoolData.endDate,
      data: {
        ...votingPoolData.data,
      },
    }
  );

  return pool;
};

/**
 * If pool existed, update pool data. Else, create new pool
 * @param {*} votingPoolData
 * @returns upserted pool data
 */
const createOrUpdateVotingPool = async (ctx, votingPoolData) => {
  const votingPool = await strapi.services["voting-pool"].findOne({
    poolId: votingPoolData.poolId,
    version: votingPoolData.version,
  });
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

/**
 * Change pool status to approved
 * @param {object} votingPoolData
 * @returns pool data with status update to approved
 */
const updateStatusToApproved = async (votingPoolData) => {
  const poolInfo = await getPoolInfo(votingPoolData.poolId);
  if (poolInfo && poolInfo.completed && !poolInfo.cancelled) {
    // change status to approved
    await strapi.services["voting-pool"].update(
      {
        id: votingPoolData.id,
      },
      {
        status: "approved",
      }
    );
  }

  return poolInfo;
};

/**
 * Change pool status to cancelled
 * @param {object} votingPoolData
 * @returns pool with status update to cancelled
 */
const cancelVotingPool = async (votingPoolData) => {
  const poolInfo = await getPoolInfo(votingPoolData.poolId);
  if (poolInfo && poolInfo.cancelled) {
    await strapi.services["voting-pool"].update(
      {
        id: votingPoolData.id,
      },
      {
        status: "cancelled",
      }
    );
  }
  return poolInfo;
};

/**
 * MARK FOR DELETE
 * @param {object} votingPoolData
 * @returns updated pool data
 */
const updateVotingPoolInfo = async (votingPoolData) => {
  const { id, projectName, unicodeName } = votingPoolData;
  const updatedPool = await strapi.services["voting-pool"].update(
    { id },
    {
      projectName: projectName,
      unicodeName: unicodeName,
      data: {
        ...votingPoolData.data,
      },
    }
  );
  return updatedPool;
};

const updateTokenBVotingPool = async (votingPoolData) => {
  const { id, data } = votingPoolData;
  const updatedPool = await strapi.services["voting-pool"].update(
    { id },
    {
      data,
    }
  );
  return updatedPool;
};

module.exports = {
  createOrUpdateVotingPool,
  updateStatusToApproved,
  cancelVotingPool,
  updateVotingPoolInfo,
  updateTokenBVotingPool,
  createVotingPool,
};
