const { setupStrapi } = require("./strapi-helper");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { exportDataToCsv } = require("./csv-helper");
const { FixedNumber } = require("@ethersproject/bignumber");
const { FIXED_NUMBER } = require("../constants");
const { isValidStaker } = require("../helpers/blockchainHelpers/farm-helper");

const _ = require("lodash");

const argv = yargs(hideBin(process.argv)).argv;
const glodaoAddress = "0x7a05CE29a44cA8dD49D967367F98D3F07E204faC";
const rewardAddressMap = new Map();
let basePriorityReward = FIXED_NUMBER.ZERO;
let baseCommunityReward = FIXED_NUMBER.ZERO;

let optionTokenRewardAddressArr = [];
const optionalTokenPriorityReward = new Map();
const optionalTokenCommunityReward = new Map();
const optionalTokenMap = new Map();
let optionalTokenArr = [];
let task = {};
let filename = "data";
const priorityPoolMap = new Map();
let allHunterArr = [];

const everyRewardMap = new Map();

async function main(argv) {
  await initialize();
  await getAllNeededData();
  const tempApplies = _.sortBy(
    await getRelatedCompleteApplies(argv.task),
    "completeTime"
  );
  await calculatePoolReward(argv.task, tempApplies);
  let rewardCalculatedArr = [];
  let optionalRewardCalculatedArr = [];
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
      task,
      "metadata.tokenContractAddress",
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    );
    accumulateAddressReward(walletAddress, bounty, "100", tokenContractAddress);
    accumulateAddressReward(
      commissionAddress,
      bounty,
      commissionRate,
      tokenContractAddress
    );
    accumulateAddressReward(
      rootAddress,
      bounty,
      rootCommissionRate,
      tokenContractAddress
    );
    accumulateAddressReward(
      glodaoAddress,
      bounty,
      glodaoCommissionRate,
      tokenContractAddress
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

  const chunks = _.chunk(rewardCalculatedArr, 10);
  switch (argv.option) {
    case "updateBounty":
      for (const subChunksOfApplies of chunks) {
        let indexBatch = 0;
        try {
          await Promise.all(
            subChunksOfApplies.map((apply) => {
              const isPriority = !_.isEmpty(priorityPoolMap.get(apply.id));
              const newPoolType = isPriority ? "priority" : "community";
              if (!newPoolType) console.log("oh shit toang doi");
              return strapi.services.apply.update(
                {
                  id: apply.id,
                },
                {
                  bounty: `${apply.bounty._value}`.substring(0, 8),
                  commissionRate: apply.commissionRate,
                  status: "awarded",
                  poolType: newPoolType,
                  optionalTokenReward: apply.optionalTokenReward.map(
                    (reward) => ({
                      ...reward,
                      bounty: `${reward.bounty._value}`.substring(0, 8),
                    })
                  ),
                }
              );
            })
          ).then(() => {
            console.log("batch completed", indexBatch++);
          });
        } catch (error) {
          console.log("\x1b[31m", "Wasted");
          console.log("\x1b[37m", error);
          console.log("\x1b[31m", "Wasted");
        }
      }
      console.log("\x1b[32m", "mission accomplished");
      // let bountyRewardArr = [];
      // for (const [key, value] of everyRewardMap) {
      //   for (let index = 0; index < value.length; index++) {
      //     const element = value[index];
      //     bountyRewardArr.push({
      //       walletAddress: key,
      //       ...element,
      //       rewardAmount: element.rewardAmount._value,
      //     });
      //   }
      // }
      // const bountyRewardChunks = _.chunk(bountyRewardArr, 10);
      // for (const subBountyRewards of bountyRewardChunks) {
      //   try {
      //     await Promise.all(
      //       subBountyRewards.map((bountyReward) => {
      //         return strapi.services["bounty-reward"].recordReward(
      //           bountyReward.walletAddress,
      //           bountyReward.tokenAddress,
      //           bountyReward.token,
      //           bountyReward.rewardAmount,
      //           bountyReward.decimals,
      //           bountyReward.tokenBasePrice
      //         );
      //       })
      //     ).then(() => {
      //       console.log("batch completed bounty");
      //     });
      //   } catch (error) {
      //     console.log("\x1b[31m", "Wasted");
      //     console.log("\x1b[37m", error);
      //     console.log("\x1b[31m", "Wasted");
      //   }
      // }
      console.log("bounty reward record finish");
      break;
    case "reverify":
      for (const subChunksOfApplies of chunks) {
        try {
          await Promise.all(
            subChunksOfApplies.map((apply) => {
              return new Promise((resolve, reject) => {
                strapi.services.apply
                  .findOne({
                    id: apply.id,
                  })
                  .then((res) => {
                    if (
                      _.isEqual(res.bounty, apply.bounty._value) &&
                      _.isEqual(res.walletAddress, apply.walletAddress)
                    )
                      return resolve(res);
                    else
                      return reject([
                        "Something when wrong when update",
                        `${res.id}`,
                      ]);
                  })
                  .catch((err) => {
                    return reject(err);
                  });
              });
            })
          );
        } catch (error) {
          console.log("\x1b[31m", "Wasted");
          console.log("\x1b[37m", error);
          console.log("\x1b[31m", "Wasted");
        }
      }
      console.log("\x1b[32m", "mission accomplished");
      break;
    case "recordReward":
      let bountyRewardArr = [];
      let secondBountyRewardArr = [];
      let index = 0;
      let finishWalletAddress = [];
      for (const [key, value] of everyRewardMap) {
        let rewardArr = [];
        for (let index = 0; index < value.length; index++) {
          const element = value[index];
          bountyRewardArr.push({
            walletAddress: key,
            ...element,
            rewardAmount: element.rewardAmount._value.substring(0, 8),
          });
          rewardArr.push({
            walletAddress: key,
            ...element,
            rewardAmount: element.rewardAmount._value.substring(0, 8),
          });
        }
        console.log(rewardArr)
        secondBountyRewardArr.push({ walletAddress: key, rewardArr });
      }
      const bountyRewardChunks = _.chunk(secondBountyRewardArr, 10);
      for (const subBountyRewards of bountyRewardChunks) {
        const finishedAddress = subBountyRewards.map((bountyReward) => ({
          walletAddress: bountyReward.walletAddress,
        }));
        try {
          await Promise.all(
            subBountyRewards.map((bountyReward) => {
              return strapi.services["bounty-reward"].recordRewards(
                bountyReward.walletAddress,
                bountyReward.rewardArr
              );
            })
          ).then(() => {
            finishWalletAddress = finishWalletAddress.concat(finishedAddress);
            console.log("batch completed bounty", index++);
          });
        } catch (error) {
          const header = [
            {
              id: "walletAddress",
              title: "walletAddress",
            },
          ];
          await exportDataToCsv(
            finishWalletAddress,
            header,
            `$finishedWithoutErrorAddress.csv`
          );

          console.log("\x1b[31m", "Wasted");
          console.log(finishedAddress);
          console.log("\x1b[37m", error);
          console.log("\x1b[31m", "Wasted");
        }
      }
      console.log("bounty reward record finish");
      break;
    default:
      await exportMapToCsvWithName(
        rewardAddressMap,
        filename + "-" + _.get(task, "metadata.rewardToken", "BUSD")
      );

      // console.log(rewardAddressMap);
      break;
  }
}
exportOptionalTokenRewardData = async () => {};
getAllNeededData = async () => {
  allHunterArr = await strapi.services.hunter.find({ _limit: -1 });
};

initialize = async () => {
  await setupStrapi();
};

accumulateAddressReward = (
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

getHunterByReferrerCode = (referrerCode) => {
  return allHunterArr.find((hunter) => hunter.referralCode === referrerCode);
  // return await strapi.services.hunter.findOne({ referralCode: referrerCode });
};

getCommissionerHunter = (referrerCode) => {
  return getHunterByReferrerCode(referrerCode);
};

getRootHunter = (referrerCode) => {
  return getHunterByReferrerCode(referrerCode);
};

calculatePoolReward = async (taskId, relatedCompleteApplies) => {
  const task = await strapi.services.task.findOne({ id: taskId });
  const countTotla = await strapi.services.apply.count({ task: taskId });
  console.log(task.name);
  console.log(task.missionIndex);
  filename = task.name + "-" + task.missionIndex;
  console.log("total par:" + task.totalParticipants);
  console.log("total par:" + countTotla);
  const allPriorityPool = relatedCompleteApplies.slice(
    0,
    task.maxPriorityParticipants
  );
  allPriorityPool.forEach((apply) => {
    priorityPoolMap.set(apply.id, apply);
  });
  let priorityCount = allPriorityPool.length;
  console.log(priorityCount);
  console.log(relatedCompleteApplies.length);
  this.task = task;
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

getRelatedCompleteApplies = async (task) => {
  return await strapi.services.apply.find({
    task,
    status: "completed",
    _limit: -1,
  });
};

exportMapToCsvWithName = async (map, name) => {
  const header = [
    {
      id: "walletAddress",
      title: "Wallet_Address",
    },
    {
      id: "rewardAmount",
      title: "Reward_Amount",
    },
  ];

  const data = [];
  for (const [key, value] of map) {
    data.push({
      walletAddress: key,
      rewardAmount: `${value._value}`.substring(0, 8),
    });
  }

  await exportDataToCsv(data, header, `${name}.csv`);
};

exportMapToCsv = async (map) => {
  const header = [
    {
      id: "walletAddress",
      title: "Wallet_Address",
    },
    {
      id: "rewardAmount",
      title: "Reward_Amount",
    },
  ];

  const data = [];
  for (const [key, value] of map) {
    data.push({
      walletAddress: key,
      rewardAmount: `${value._value}`.substring(0, 8),
    });
  }

  await exportDataToCsv(data, header, `${filename}.csv`);
};

main(argv)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
