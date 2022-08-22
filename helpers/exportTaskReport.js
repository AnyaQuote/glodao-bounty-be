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
let optionalTokenArr = [];
let task = {};
let relatedApplies = [];
let filename = "data";
const priorityPoolMap = new Map();
let allHunterArr = [];

async function main(argv) {
  await initialize();
  const task = await strapi.services.task.findOne({ id: argv.task });
  filename = task.name;
  const tempApplies = await getRelatedCompleteApplies(argv.task);
  relatedApplies = tempApplies;
  console.log(relatedApplies.length);
  // await calculatePoolReward(argv.task, tempApplies);

  await exportMapToCsv(rewardAddressMap);
}

initialize = async () => {
  await setupStrapi();
};

getRelatedCompleteApplies = async (task) => {
  console.log(task);
  const res = await strapi.services.apply.find({
    task,
    // status_ne: "processing",
    _limit: -1,
  });
  console.log(res);
  return res;
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
