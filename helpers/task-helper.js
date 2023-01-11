const { getHunters } = require("../assets/hunters");
const _ = require("lodash");
const { FixedNumber } = require("@ethersproject/bignumber");
const { FIXED_NUMBER } = require("../constants");

const glodaoAddress = "0x7a05CE29a44cA8dD49D967367F98D3F07E204faC";
const rewardAddressMap = new Map();
let basePriorityReward = FIXED_NUMBER.ZERO;
let baseCommunityReward = FIXED_NUMBER.ZERO;

const optionalTokenPriorityReward = new Map();
const optionalTokenCommunityReward = new Map();
const optionalTokenMap = new Map();
let optionalTokenArr = [];
const priorityPoolMap = new Map();
const everyRewardMap = new Map();
let allHunterArr = getHunters();

const resetAllData = () => {
  optionalTokenPriorityReward.clear();
  optionalTokenCommunityReward.clear();
  optionalTokenMap.clear();
  optionalTokenArr = [];
  priorityPoolMap.clear();
  everyRewardMap.clear();
  allHunterArr = getHunters();
  rewardAddressMap.clear();
};
const getTaskRewards = (task, relatedCompleteApplies) => {
  resetAllData();
  const tempApplies = relatedCompleteApplies;
  calculatePoolReward(task, tempApplies);
  let rewardCalculatedArr = [];
  for (let index = 0; index < tempApplies.length; index++) {
    const apply = tempApplies[index];
    const hunter = apply.hunter;
    let commissionRate = 3;
    let rootCommissionRate = 2;
    let commissionAddress = "######";
    let rootAddress = "######";
    let glodaoCommissionRate = 0;
    const commissionerHunter = getCommissionerHunter(hunter.referrerCode);
    const rootHunter = getRootHunter(hunter.root);
    const isPriority = !_.isEmpty(priorityPoolMap.get(apply.id));
    if (hunter.referrerCode === "######" || _.isEmpty(commissionerHunter)) {
      commissionRate = 0;
      glodaoCommissionRate = 5;
      rootCommissionRate = 0;
    } else {
      commissionAddress = commissionerHunter.address;
      try {
        // commissionRate = (await isValidStaker(
        //   commissionAddress,
        //   1000,
        //   task.tokenBasePrice
        // ))
        //   ? 5
        //   : 3;
        commissionRate = 3;
      } catch (error) {
        console.log(error);
      }
    }
    if (hunter.root === "######" || _.isEmpty(rootHunter))
      rootCommissionRate = 0;
    else rootAddress = rootHunter.address;
    if (
      !_.isEmpty(commissionerHunter) &&
      commissionerHunter.hunterRole === "company"
    ) {
      rootCommissionRate = 0;
      commissionRate = 5;
    }
    rewardCalculatedArr.push({
      ...apply,
      bounty: isPriority ? basePriorityReward : baseCommunityReward,
      commissionRate,
      commissionAddress,
      rootAddress,
      rootCommissionRate,
      glodaoAddress,
      glodaoCommissionRate,
      optionalTokenReward: optionalTokenArr.map((token) => ({
        rewardToken: token.rewardToken,
        bounty: isPriority
          ? optionalTokenPriorityReward.get(token.tokenContractAddress)
          : optionalTokenCommunityReward.get(token.tokenContractAddress),
        tokenContractAddress: token.tokenContractAddress,
        tokenBasePrice: token.tokenBasePrice,
        decimals: token.decimals,
      })),
    });
  }

  rewardAddressMap.set(glodaoAddress, FIXED_NUMBER.ZERO);
  rewardCalculatedArr.forEach((apply) => {
    const {
      bounty,
      walletAddress,
      commissionAddress,
      rootAddress,
      commissionRate,
      rootCommissionRate,
      glodaoCommissionRate,
      optionalTokenReward,
    } = apply;
    const tokenContractAddress = _.get(
      apply.task,
      "metadata.tokenContractAddress",
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    );
    const tokenBasePrice = _.get(apply.task, "tokenBasePrice", "1");
    const decimals = _.get(apply.task, "metadata.decimals", "18");
    const rewardToken = _.get(apply.task, "metadata.rewardToken", "BUSD");
    accumulateAddressReward(
      walletAddress,
      bounty,
      "100",
      tokenContractAddress,
      decimals,
      rewardToken,
      tokenBasePrice
    );
    accumulateAddressReward(
      commissionAddress,
      bounty,
      commissionRate,
      tokenContractAddress,
      decimals,
      rewardToken,
      tokenBasePrice
    );
    accumulateAddressReward(
      rootAddress,
      bounty,
      rootCommissionRate,
      tokenContractAddress,
      decimals,
      rewardToken,
      tokenBasePrice
    );
    accumulateAddressReward(
      glodaoAddress,
      bounty,
      glodaoCommissionRate,
      tokenContractAddress,
      decimals,
      rewardToken,
      tokenBasePrice
    );
    optionalTokenReward.forEach((optionalToken) => {
      accumulateAddressReward(
        walletAddress,
        optionalToken.bounty,
        "100",
        optionalToken.tokenContractAddress,
        optionalToken.decimals,
        optionalToken.rewardToken,
        optionalToken.tokenBasePrice,
        true
      );
      accumulateAddressReward(
        commissionAddress,
        optionalToken.bounty,
        commissionRate,
        optionalToken.tokenContractAddress,
        optionalToken.decimals,
        optionalToken.rewardToken,
        optionalToken.tokenBasePrice,
        true
      );
      accumulateAddressReward(
        rootAddress,
        optionalToken.bounty,
        rootCommissionRate,
        optionalToken.tokenContractAddress,
        optionalToken.decimals,
        optionalToken.rewardToken,
        optionalToken.tokenBasePrice,
        true
      );
      accumulateAddressReward(
        glodaoAddress,
        optionalToken.bounty,
        glodaoCommissionRate,
        optionalToken.tokenContractAddress,
        optionalToken.decimals,
        optionalToken.rewardToken,
        optionalToken.tokenBasePrice,
        true
      );
    });
  });
  //TODO: update to every reward map which currently wrong calculation
  return rewardAddressMap;
};

const calculatePoolReward = async (task, relatedCompleteApplies) => {
  const allPriorityPool = relatedCompleteApplies.slice(
    0,
    task.maxPriorityParticipants
  );
  allPriorityPool.forEach((apply) => {
    priorityPoolMap.set(apply.id, apply);
  });
  let priorityCount = allPriorityPool.length;
  if (task.maxPriorityParticipants === 0)
    basePriorityReward = priorityCount = 0;
  else
    basePriorityReward = FixedNumber.from(
      _.get(task, "priorityRewardAmount", "0")
    ).divUnsafe(FixedNumber.from(_.get(task, "maxPriorityParticipants", "1")));
  const totalCommunityReward = FixedNumber.from(
    _.get(task, "rewardAmount", "0")
  )
    .mulUnsafe(FixedNumber.from("93"))
    .divUnsafe(FIXED_NUMBER.HUNDRED)
    .subUnsafe(FixedNumber.from(_.get(task, "priorityRewardAmount", "0")));
  const optionalTokens = _.get(task, "optionalTokens", []);
  optionalTokenArr = optionalTokens;

  const totalCommunityParticipants =
    relatedCompleteApplies.length - priorityCount;
  // UPDATE TO USING FAKE NUMBER FOR REWARD CALCULATION

  // const totalCommunityParticipants = task.totalParticipants - priorityCount;
  optionalTokens.forEach((token) => {
    optionalTokenMap.set(token.tokenContractAddress, token);
    let optionPriorityReward = 0;
    let optionCommunityReward = 0;
    if (task.maxPriorityParticipants !== 0)
      optionPriorityReward = FixedNumber.from(
        _.get(token, "priorityRewardAmount", "0")
      ).divUnsafe(
        FixedNumber.from(_.get(task, "maxPriorityParticipants", "1"))
      );
    optionCommunityReward = FixedNumber.from(_.get(token, "rewardAmount", "0"))
      .mulUnsafe(FixedNumber.from("93"))
      .divUnsafe(FIXED_NUMBER.HUNDRED)
      .subUnsafe(FixedNumber.from(_.get(token, "priorityRewardAmount", "0")))
      .divUnsafe(FixedNumber.from(`${totalCommunityParticipants}`));
    optionalTokenPriorityReward.set(
      token.tokenContractAddress,
      optionPriorityReward
    );
    optionalTokenCommunityReward.set(
      token.tokenContractAddress,
      optionCommunityReward
    );
  });
  baseCommunityReward = totalCommunityReward.divUnsafe(
    FixedNumber.from(`${totalCommunityParticipants}`)
  );
};

const accumulateAddressReward = (
  address,
  bounty,
  rate,
  tokenAddress,
  decimals = "18",
  token = "BUSD",
  tokenBasePrice = "1",
  isOptionalToken = false
) => {
  if (!address || _.isEqual(address, "######")) return;
  if (!isOptionalToken) {
    const previousReward = rewardAddressMap.get(address)
      ? rewardAddressMap.get(address)
      : FIXED_NUMBER.ZERO;
    rewardAddressMap.set(
      address,
      previousReward.addUnsafe(
        bounty
          .mulUnsafe(FixedNumber.from(`${rate}`))
          .divUnsafe(FIXED_NUMBER.HUNDRED)
      )
    );
  }

  const everyPreviousReward = everyRewardMap.get(address)
    ? everyRewardMap.get(address)
    : [];
  let existedFlag = false;
  let everyAfterReward = [];
  everyPreviousReward.forEach((token) => {
    if (token.tokenAddress === tokenAddress) {
      existedFlag = true;
      everyAfterReward.push({
        ...token,
        rewardAmount: token.rewardAmount.addUnsafe(
          bounty
            .mulUnsafe(FixedNumber.from(`${rate}`))
            .divUnsafe(FIXED_NUMBER.HUNDRED)
        ),
      });
    } else everyAfterReward.push(token);
  });
  if (!existedFlag)
    everyAfterReward.push({
      decimals,
      tokenAddress,
      rewardAmount: bounty,
      token,
      tokenBasePrice,
    });
  everyRewardMap.set(address, everyAfterReward);
};

const getHunterByReferrerCode = (referrerCode) => {
  return allHunterArr.find((hunter) => hunter.referralCode === referrerCode);
  // return await strapi.services.hunter.findOne({ referralCode: referrerCode });
};

const getCommissionerHunter = (referrerCode) => {
  return getHunterByReferrerCode(referrerCode);
};

const getRootHunter = (referrerCode) => {
  return getHunterByReferrerCode(referrerCode);
};
module.exports = {
  getTaskRewards,
};
