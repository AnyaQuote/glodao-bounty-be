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
let task = {};
let filename = "data";
const priorityPoolMap = new Map();
let allHunterArr = [];

async function main(argv) {
  await initialize();
  await getAllNeededData();
  const tempApplies = _.sortBy(
    await getRelatedCompleteApplies(argv.task),
    "completeTime"
  );
  await calculatePoolReward(argv.task, tempApplies);
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
    } = apply;
    accumulateAddressReward(walletAddress, bounty, "100");
    accumulateAddressReward(commissionAddress, bounty, commissionRate);
    accumulateAddressReward(rootAddress, bounty, rootCommissionRate);
    accumulateAddressReward(glodaoAddress, bounty, glodaoCommissionRate);
  });

  const chunks = _.chunk(rewardCalculatedArr, 10);
  switch (argv.option) {
    case "updateBounty":
      for (const subChunksOfApplies of chunks) {
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
                }
              );
            })
          ).then(() => {
            console.log("batch completed");
          });
        } catch (error) {
          console.log("\x1b[31m", "Wasted");
          console.log("\x1b[37m", error);
          console.log("\x1b[31m", "Wasted");
        }
      }
      console.log("\x1b[32m", "mission accomplished");
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
    default:
      await exportMapToCsv(rewardAddressMap);
      // console.log(rewardAddressMap);
      break;
  }
}

getAllNeededData = async () => {
  allHunterArr = await strapi.services.hunter.find({ _limit: -1 });
};

initialize = async () => {
  await setupStrapi();
};

accumulateAddressReward = (address, bounty, rate) => {
  if (!address || _.isEqual(address, "######")) return;
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
  filename = task.name + "-" + task.missionIndex + "-" + argv.date;
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
  const totalCommunityParticipants =
    relatedCompleteApplies.length - priorityCount;
  console.log(totalCommunityParticipants);
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
