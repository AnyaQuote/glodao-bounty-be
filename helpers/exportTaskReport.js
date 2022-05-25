const { setupStrapi } = require("./strapi-helper");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { exportDataToCsv } = require("./csv-helper");
const { FixedNumber } = require("@ethersproject/bignumber");
const { FIXED_NUMBER } = require("../constants");
const { isValidStaker } = require("../helpers/blockchainHelpers/farm-helper");
const moment = require("moment");

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
  const tempApplies = await getRelatedCompleteApplies(argv.task);
  relatedApplies = tempApplies;
  await calculatePoolReward(argv.task, tempApplies);

  switch (argv.option) {
    case "updateBounty":
      break;

    default:
      await exportMapToCsv(rewardAddressMap);
      // console.log(rewardAddressMap);
      break;
  }
}
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
exportToCsv = async (dataArr) => {
  const header = [
    {
      id: "userTwitter",
      title: "Twitter_Username",
    },
    {
      id: "address",
      title: "Wallet_Address",
    },
    {
      id: "taskStatus",
      title: "Task_Status",
    },
    {},
  ];
};

exportMapToCsv = async (map) => {
  const header = [
    {
      id: "twitterName",
      title: "Twitter_Username",
    },
    {
      id: "walletAddress",
      title: "Wallet_Address",
    },
    {
      id: "completedTime",
      title: "Completed_Time",
    },
  ];

  const data = [];
  // for (const [key, value] of map) {
  //   data.push({
  //     walletAddress: key,
  //     rewardAmount: value._value,
  //   });
  // }
  for (let index = 0; index < relatedApplies.length; index++) {
    const element = relatedApplies[index];
    data.push({
      twitterName: element.hunter.name,
      walletAddress: element.hunter.address,
      completedTime: moment(element.completeTime).toISOString(),
    });
  }

  await exportDataToCsv(
    data,
    header,
    `${filename}-completed-user-${argv.date}.csv`
  );
};

main(argv)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
