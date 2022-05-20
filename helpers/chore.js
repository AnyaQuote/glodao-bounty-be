const { setupStrapi } = require("./strapi-helper");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { exportDataToCsv } = require("./csv-helper");
const { FixedNumber } = require("@ethersproject/bignumber");
const { FIXED_NUMBER, GLODAO_ROOT_CODE } = require("../constants");
const { isValidStaker } = require("../helpers/blockchainHelpers/farm-helper");
const moment = require("moment");
const csvToJson = require("csvtojson");

const _ = require("lodash");

const argv = yargs(hideBin(process.argv)).argv;
const glodaoAddress = "0x7a05CE29a44cA8dD49D967367F98D3F07E204faC";
const rewardAddressMap = new Map();
let basePriorityReward = FIXED_NUMBER.ZERO;
let baseCommunityReward = FIXED_NUMBER.ZERO;
let task = {};
let relatedApplies = [];
let filename = "";

const getAllReferralCount = async () => {
  let referralCountArr = [];
  const hunters = await strapi.services.hunter.find({
    _limit: -1,
  });
  console.log("oh no");
  const groupByReferrerCode = _.groupBy(hunters, "referrerCode");
  console.log(groupByReferrerCode);
  for (const key in groupByReferrerCode) {
    if (Object.hasOwnProperty.call(groupByReferrerCode, key)) {
      const element = groupByReferrerCode[key];
      referralCountArr.push({ name: key, referralCount: element.length });
    }
  }

  const header = [
    {
      id: "name",
      title: "Twitter_Username",
    },
    {
      id: "referralCount",
      title: "Referrals_Count",
    },
  ];
  referralCountArr = _.orderBy(referralCountArr, ["referralCount"], ["desc"]);
  referralCountArr = referralCountArr.slice(0, 20);
  for (let index = 0; index < referralCountArr.length; index++) {
    const element = referralCountArr[index];
    if (element.name === "######") continue;
    const supaname = await strapi.services.hunter.findOne({
      referralCode: element.name,
    });
    console.log(supaname);
    referralCountArr[index].name = supaname.name;
  }

  await exportDataToCsv(referralCountArr, header, `referralCount.csv`);
};

async function getTotalTaskReward() {
  const tasks = await strapi.services.task.find({
    _limit: -1,
    status: "ended",
  });
  let total = 0;
  tasks.forEach((task) => {
    total += _.toNumber(task.rewardAmount);
    console.log(task.rewardAmount);
  });
  total -= 119.095766;
  console.log(total);
}
async function getAllPriorityBounty(taskId) {
  const bounties = await strapi.services.apply.find({
    _limit: -1,
    status_ne: "completed",
    poolType: "priority",
    task: taskId,
  });
  console.log(bounties.length);
  console.log(bounties);
  _.sortBy(bounties, "completeTime").forEach((bounty) =>
    console.log(bounty.completeTime)
  );
}

async function merge2Csv() {
  const supamap = new Map();
  let arr = await csvToJson().fromFile("GloDAO-40-18-19.csv");
  console.log(arr.length);
  arr.forEach((wallet) => {
    const { Wallet_Address, Reward_Amount } = wallet;
    const previousReward = supamap.get(Wallet_Address)
      ? supamap.get(Wallet_Address)
      : FIXED_NUMBER.ZERO;
    supamap.set(
      Wallet_Address,
      previousReward.addUnsafe(FixedNumber.from(`${Reward_Amount}`))
    );
  });
  arr = await csvToJson().fromFile("GloDAO-41-18-19.csv");
  console.log(arr.length);
  arr.forEach((wallet) => {
    const { Wallet_Address, Reward_Amount } = wallet;
    const previousReward = supamap.get(Wallet_Address)
      ? supamap.get(Wallet_Address)
      : FIXED_NUMBER.ZERO;
    supamap.set(
      Wallet_Address,
      previousReward.addUnsafe(FixedNumber.from(`${Reward_Amount}`))
    );
  });
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
  for (const [key, value] of supamap) {
    data.push({
      walletAddress: key,
      rewardAmount: `${value._value}`,
    });
  }

  await exportDataToCsv(data, header, `consolidate-18-19.csv`);
}
async function main(argv) {
  // await initialize();

  // await getAllPriorityBounty(argv.task);
  return;
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

getHunterByReferrerCode = async (referrerCode) => {
  return await strapi.services.hunter.findOne({ referralCode: referrerCode });
};

getCommissionerHunter = async (referrerCode) => {
  return await getHunterByReferrerCode(referrerCode);
};

getRootHunter = async (referrerCode) => {
  return await getHunterByReferrerCode(referrerCode);
};

calculatePoolReward = async (taskId, relatedCompleteApplies) => {
  const task = await strapi.services.task.findOne({ id: taskId });
  console.log(task.name);
  filename = task.name;
  console.log(relatedCompleteApplies.length);
  this.task = task;
  if (task.maxPriorityParticipants === 0) basePriorityReward = 0;
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
  const totalCommunityParticipants = _.filter(
    relatedCompleteApplies,
    (apply) => apply.poolType === "community"
  ).length;
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
    `${filename}-completed-user${argv.date}.csv`
  );
};

main(argv)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
