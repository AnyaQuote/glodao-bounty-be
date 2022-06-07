"use strict";
const { FixedNumber } = require("@ethersproject/bignumber");
const moment = require("moment");
const { bigNumberHelper } = require("../../../helpers/bignumber-helper");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const recordReward = async (
  walletAddress,
  tokenAddress,
  token,
  rewardAmount,
  decimals = "18",
  tokenBasePrice = "1"
) => {
  try {
    const record = await strapi.services["bounty-reward"].findOne({
      walletAddress,
    });
    if (!record)
      return await strapi.services["bounty-reward"].create({
        walletAddress,
        rewards: [
          {
            tokenAddress,
            token,
            rewardAmount: `${rewardAmount}`,
            decimals,
            tokenBasePrice,
          },
        ],
        rewardsHistory: [
          {
            tokenAddress,
            token,
            rewardAmount,
            datetime: moment().toISOString(),
            type: "add",
            tokenBasePrice,
          },
        ],
        depositHistory: [
          {
            tokenAddress,
            token,
            rewardAmount,
            datetime: moment().toISOString(),
            tokenBasePrice,
          },
        ],
      });

    const rewardMap = new Map(record.rewards.map((x) => [x.tokenAddress, x]));

    let rewardArr = [];
    let existedFlag = false;
    let distributedRecord = record.rewardsHistory || [];
    let depositHistory = record.depositHistory || [];

    for (const [key, value] of rewardMap) {
      if (key === tokenAddress) {
        rewardArr.push({
          tokenAddress,
          token,
          rewardAmount: FixedNumber.from(`${value.rewardAmount}`).addUnsafe(
            FixedNumber.from(`${rewardAmount}`)
          )._value,
          decimals,
          tokenBasePrice,
        });
        existedFlag = true;
        distributedRecord.push({
          tokenAddress,
          token,
          rewardAmount,
          datetime: moment().toISOString(),
          type: "add",
          tokenBasePrice,
        });
        depositHistory.push({
          tokenAddress,
          token,
          rewardAmount,
          datetime: moment().toISOString(),
          tokenBasePrice,
        });
      } else rewardArr.push({ ...value });
    }
    if (!existedFlag) {
      rewardArr.push({
        tokenAddress,
        token,
        rewardAmount,
        decimals,
        tokenBasePrice,
      });
      distributedRecord.push({
        tokenAddress,
        token,
        rewardAmount,
        datetime: moment().toISOString(),
        type: "add",
        tokenBasePrice,
      });
      depositHistory.push({
        tokenAddress,
        token,
        rewardAmount,
        datetime: moment().toISOString(),
        tokenBasePrice,
      });
    }

    return await strapi.services["bounty-reward"].update(
      { id: record.id },
      {
        rewards: rewardArr,
        rewardsHistory: distributedRecord,
        depositHistory,
      }
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const distributeReward = async (walletAddress, tokenAddress, rewardAmount) => {
  try {
    const record = await strapi.services["bounty-reward"].findOne({
      walletAddress,
    });
    if (!record)
      return strapi.errors.badRequest("This address did not have any");

    const rewardMap = new Map(record.rewards.map((x) => [x.tokenAddress, x]));

    let rewardArr = [];
    let existedFlag = false;
    let distributedRecord = record.rewardsHistory || [];
    let withdrawHistory = record.withdrawHistory || [];

    for (const [key, value] of rewardMap) {
      if (key === tokenAddress) {
        if (FixedNumber.from(`${value.rewardAmount}`).isZero()) {
          throw new Error("Not enough balance left");
        }
        if (
          bigNumberHelper.lt(
            FixedNumber.from(`${value.rewardAmount}`),
            FixedNumber.from(`${rewardAmount}`)
          )
        ) {
          throw new Error("Not enough balance left");
        }
        existedFlag = true;
        rewardArr.push({
          ...value,
          tokenAddress,
          rewardAmount: FixedNumber.from(`${value.rewardAmount}`).subUnsafe(
            FixedNumber.from(`${rewardAmount}`)
          )._value,
        });
        distributedRecord.push({
          tokenAddress,
          token: value.token,
          rewardAmount,
          datetime: moment().toISOString(),
          type: "sub",
          tokenBasePrice: value.tokenBasePrice,
        });
        withdrawHistory.push({
          tokenAddress,
          token: value.token,
          rewardAmount,
          datetime: moment().toISOString(),
          tokenBasePrice: value.tokenBasePrice,
        });
      } else rewardArr.push({ ...value });
    }
    if (!existedFlag) throw new Error("Not enough balance left");

    return await strapi.services["bounty-reward"].update(
      { id: record.id },
      {
        rewards: rewardArr,
        rewardsHistory: distributedRecord,
        withdrawHistory,
      }
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  recordReward,
  distributeReward,
};
