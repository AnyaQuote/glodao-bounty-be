const { setupStrapi } = require("./strapi-helper");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { exportDataToCsv } = require("./csv-helper");
const { orderBy } = require("lodash");

const argv = yargs(hideBin(process.argv)).argv;

async function main(argv) {
  await initialize();
  await exportApplyToCsv(await getRelatedCompleteApplies(argv.task));
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
      id: "commission",
      title: "COMMISSION_OWNER",
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
        status: element.status,
        poolType: element.poolType,
        completedTime: element.updatedAt,
        commission: element.hunter.referrerCode,
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
