const { setupStrapi } = require("./strapi-helper");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { exportDataToCsv } = require("./csv-helper");
const { orderBy } = require("lodash");

const argv = yargs(hideBin(process.argv)).argv;
const commissionerAddressMap = new Map();

async function main(argv) {
  await initialize();
  const relatedApplies = [];
  const tempApplies = await getRelatedCompleteApplies(argv.task);

  for (let index = 0; index < tempApplies.length; index++) {
    const apply = tempApplies[index];
    const commissionerAddress = await getCommissionerAddress(
      apply.hunter.referrerCode
    );
    relatedApplies.push({
      ...apply,
      commissionerAddress,
    });
  }
  await exportApplyToCsv(relatedApplies);
}

initialize = async () => {
  await setupStrapi();
};

getRelatedCompleteApplies = async (task) => {
  return await strapi.services.apply.find({
    task,
    status: "completed",
  });
};

getCommissionerAddress = async (referrerCode) => {
  if (!referrerCode || referrerCode === "######") return "######";
  if (!commissionerAddressMap.get(referrerCode)) {
    try {
      const hunter = await strapi.services.hunter.findOne({
        referralCode: referrerCode,
      });
      commissionerAddressMap.set(referrerCode, hunter.address);
      return hunter.address;
    } catch (error) {
      console.log(error);
      return "######";
    }
  } else return commissionerAddressMap.get(referrerCode);
};

exportApplyToCsv = async (applyData) => {
  const header = [
    {
      id: "id",
      title: "APPLY_ID",
    },
    {
      id: "task",
      title: "TASK_NAME",
    },
    {
      id: "walletAddress",
      title: "WALLET_ADDRESS",
    },
    {
      id: "status",
      title: "STATUS",
    },
    {
      id: "poolType",
      title: "POOL_TYPE",
    },
    {
      id: "completedTime",
      title: "COMPLETED_TIME",
    },
    {
      id: "hunterId",
      title: "HUNTER_ID",
    },
    {
      id: "hunterName",
      title: "HUNTER_NAME",
    },
    {
      id: "commission",
      title: "COMMISSIONER_ADDRESS",
    },
    {
      id: "reward",
      title: "REWARD_AMOUNT",
    },
    {
      id: "commissionRate",
      title: "COMMISSION_AMOUNT",
    },
    {
      id: "rejectReason",
      title: "REJECT_REASON",
    },
  ];

  const data = [];
  orderBy(applyData, ["status", "poolType"], ["asc", "desc"]).forEach(
    (element) => {
      data.push({
        id: element.id,
        task: element.task.name,
        walletAddress: element.walletAddress,
        hunterId: element.hunter.id,
        hunterName: element.hunter.name,
        status: element.status,
        poolType: element.poolType,
        completedTime: element.updatedAt,
        commission: element.commissionerAddress,
        reward: 0,
        commissionRate: 0,
        rejectReason: "",
      });
    }
  );

  await exportDataToCsv(data, header);
};

main(argv)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
