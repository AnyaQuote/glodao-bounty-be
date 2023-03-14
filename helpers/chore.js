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
const {
  getChatMember,
  isUserFollowChat,
  getChatFromLink,
} = require("./telegram-bot-helpers");
const { getTweetIdFromLink } = require("./twitter-helper");
const { similarity } = require("./index");
const { readTransactionDetail } = require("./wallet-helper");
const { getTransactionReceipt } = require("./blockchain-helper");

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
  // let arr = await csvToJson().fromFile("GloDAO-216-BUSD.csv");
  // console.log(arr.length);
  // arr.forEach((wallet) => {
  //   const { Wallet_Address, Reward_Amount } = wallet;
  //   const previousReward = supamap.get(Wallet_Address)
  //     ? supamap.get(Wallet_Address)
  //     : FIXED_NUMBER.ZERO;
  //   supamap.set(
  //     Wallet_Address,
  //     previousReward.addUnsafe(FixedNumber.from(`${Reward_Amount}`))
  //   );
  // });
  // arr = await csvToJson().fromFile("GloDAO-217-BUSD.csv");
  // console.log(arr.length);
  // arr.forEach((wallet) => {
  //   const { Wallet_Address, Reward_Amount } = wallet;
  //   const previousReward = supamap.get(Wallet_Address)
  //     ? supamap.get(Wallet_Address)
  //     : FIXED_NUMBER.ZERO;
  //   supamap.set(
  //     Wallet_Address,
  //     previousReward.addUnsafe(FixedNumber.from(`${Reward_Amount}`))
  //   );
  // });
  // arr = await csvToJson().fromFile("Realbox Promotion-203-BUSD.csv");
  // console.log(arr.length);
  // arr.forEach((wallet) => {
  //   const { Wallet_Address, Reward_Amount } = wallet;
  //   const previousReward = supamap.get(Wallet_Address)
  //     ? supamap.get(Wallet_Address)
  //     : FIXED_NUMBER.ZERO;
  //   supamap.set(
  //     Wallet_Address,
  //     previousReward.addUnsafe(FixedNumber.from(`${Reward_Amount}`))
  //   );
  // });
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

  // await exportDataToCsv(data, header, `consolidate-110822-120822-real.csv`);
}
async function revertApply() {
  const applies = await strapi.services.apply.find({
    task: argv.task,
    status: "awarded",
    _limit: -1,
  });
  const chunks = _.chunk(applies, 10);
  for (const subChunksOfApplies of chunks) {
    try {
      await Promise.all(
        subChunksOfApplies.map((apply) => {
          return strapi.services.apply.update(
            {
              id: apply.id,
            },
            {
              status: "completed",
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
}
async function verifyTelegramFollow() {
  try {
    const a = getChatFromLink("https://t.me/bottoan2");
    console.log(a);

    const res = await getChatMember(a, 5192739643);
    console.log(res);
  } catch (error) {
    console.log(error);
  }
}
async function getAllAlgoDiscordUsers() {
  // 941406884093653032
  const limit = 1000;
  let users = [];
  let after = 0;
  let index = 0;
  try {
    do {
      console.log(index);
      index++;
      const res = await listGuildMember("941406884093653032", limit, after);
      if (!res || res.length === 0) break;
      after = res[res.length - 1].user.id;
      users = users.concat(res.map((el) => el.user));
      if (res.length < limit) break;
      await sleep(2000);
    } while (true);
    console.log(users.length);
    const header = [
      {
        id: "username",
        title: "username",
      },
    ];
    await exportDataToCsv(
      users
        .map((user) => ({
          id: user.id,
          username: user.username + "#" + user.discriminator,
          bot: user.bot || false,
        }))
        .filter((user) => !user.bot),
      header,
      `$discord.csv`
    );
  } catch (error) {
    console.log(error);
  }
}
async function getSomethingChore() {
  // 626d77be10db5e0a6cbb43ba
  // 627373865f773d10cdf1c850
  const hunters = [
    "buitrun04797100",
    "na58kt4",
    "Ponceuu08203383",
    "Abbottdd361617",
    "pirowvdugueqpo",
    "midawn1k",
  ];
  let finalArr = [];
  for (let index = 0; index < hunters.length; index++) {
    const hunterName = hunters[index];
    const hunter = await strapi.services.hunter.findOne({ name: hunterName });
    const applies = await strapi.services.apply.find({
      _limit: -1,
      hunter: hunter,
      status_ne: "processing",
    });
    const totalCompleteMissionCountWithTubbly = applies;
    const totalSocialMissionCountWithTubbly = applies.filter(
      (apply) => apply.task.type === "bounty"
    );

    const totalCompleteMissionCountWithoutTubbly = applies.filter(
      (apply) => apply.task.id !== "628f9e2be57ee96d97ac2b25"
    );

    const totalSocialMissionCountWithoutTubbly = applies.filter(
      (apply) =>
        apply.task.id !== "628f9e2be57ee96d97ac2b25" &&
        apply.task.type === "bounty"
    );

    console.log(
      totalCompleteMissionCountWithTubbly.length,
      totalCompleteMissionCountWithoutTubbly.length,
      totalSocialMissionCountWithTubbly.length,
      totalSocialMissionCountWithoutTubbly.length
    );
    finalArr.push({
      ...hunter,
      totalCompleteMission: totalCompleteMissionCountWithTubbly.length,
      totalCompleteMissionWithoutTubbly:
        totalCompleteMissionCountWithoutTubbly.length,
      totalSocialMission: totalSocialMissionCountWithTubbly.length,
      totalSocialMissionWithoutTubbly:
        totalSocialMissionCountWithoutTubbly.length,
    });
  }
  const headers = [
    {
      id: "name",
      title: "hunterName",
    },
    {
      id: "id",
      title: "hunterId",
    },
    {
      id: "twitterId",
      title: "twitterId",
    },
    {
      id: "address",
      title: "walletAddress",
    },
    {
      id: "createdAt",
      title: "accountCreatedTime",
    },
    {
      id: "totalCompleteMission",
      title: "totalCompleteMission",
    },
    {
      id: "totalCompleteMissionWithoutTubbly",
      title: "totalCompleteMissionWithoutTubbly",
    },
    {
      id: "totalSocialMission",
      title: "totalSocialMission",
    },
    {
      id: "totalSocialMissionWithoutTubbly",
      title: "totalSocialMissionWithoutTubbly",
    },
  ];

  await exportDataToCsv(
    finalArr.map((hunter) => ({
      ...hunter,
      twitterId: hunter.user.twitterId,
    })),
    headers,
    `active-user-distinct-after-event.csv`
  );
}
async function distributeBUSD() {
  const bountyRewards = await strapi.services["bounty-reward"].find({
    _limit: -1,
  });
  const chunks = _.chunk(_.uniqBy(bountyRewards, "walletAddress"), 10);
  let index = 0;
  for (const subChunks of chunks) {
    try {
      await Promise.all(
        subChunks.map((bountyReward) => {
          // console.log(bountyReward.id);
          // console.log(bountyReward.walletAddress);
          const { id, walletAddress } = bountyReward;
          const busdReward = _.get(bountyReward, "rewards", []).filter(
            (r) => r.token === "BUSD"
          )[0];
          if (!busdReward) return;
          // console.log(busdReward);
          const { tokenAddress, rewardAmount } = busdReward;
          if (
            !busdReward ||
            FixedNumber.from(`${busdReward.rewardAmount}`).isZero()
          ) {
            console.log("oh shit");
          } else {
            // console.log("oh yeah", index++);
            // return strapi.services["bounty-reward"].find({
            //   id: bountyReward.id,
            // });
            // console.log(walletAddress, busdReward, rewardAmount);
            return strapi.services["bounty-reward"].distributeReward(
              walletAddress,
              tokenAddress,
              rewardAmount
            );
          }
        })
      ).then((res) => {
        console.log("find batch complete");
      });
    } catch (error) {
      console.log("\x1b[31m", "Wasted");
      console.log("\x1b[37m", error);
      console.log("\x1b[31m", "Wasted");
      return;
    }
  }
  console.log(_.uniqBy(bountyRewards, "walletAddress").length);
}
async function updateAllBUSDToGLD() {
  const alls = await strapi.services["bounty-reward"].find({
    _limit: -1,
    updatedAt_gt: moment("2022-08-14 19:00").toISOString(),
  });
  const chunks = _.chunk(alls, 10);
  let index = 0;
  for (const subChunks of chunks) {
    index = index + 1;
    try {
      await Promise.all(
        subChunks.map((bountyReward) => {
          return strapi.services["bounty-reward"].update(
            { id: bountyReward.id },
            {
              rewards: bountyReward.rewards.filter((r) => r.token === "GLD"),
              rewardsHistory: bountyReward.rewardsHistory.filter(
                (el) => !el.datetime.toString().startsWith("2022-08-15")
              ),
              depositHistory: bountyReward.depositHistory.filter(
                (el) => !el.datetime.toString().startsWith("2022-08-15")
              ),
            }
          );
        })
      ).then((res) => {
        console.log("find batch complete", index);
      });
    } catch (error) {
      console.log("\x1b[31m", "Wasted");
      console.log("\x1b[37m", error);
      console.log("\x1b[31m", "Wasted");
      return;
    }
  }
  return;
  console.log(alls.length);
  const a = alls[0];
  const b = {
    ...a,
    rewards: a.rewards.filter((r) => r.token === "GLD"),
    rewardsHistory: a.rewardsHistory.filter(
      (el) => !el.datetime.toString().startsWith("2022-08-15")
    ),
    depositHistory: a.depositHistory.filter(
      (el) => !el.datetime.toString().startsWith("2022-08-15")
    ),
  };
  console.log(b.rewards);
  console.log(a.rewardsHistory[a.rewardsHistory.length - 1].datetime);
  console.log(
    a.rewardsHistory[a.rewardsHistory.length - 1].datetime.toString()
  );
  console.log(
    a.rewardsHistory[a.rewardsHistory.length - 1].datetime
      .toString()
      .startsWith("2022-08-15")
  );
}
async function sendGld() {
  const arr = [
    "0xc27E35EE758b2dd9826026D8bBf52f822002bA6c",
    "0xb641934f5cD11755581D3587Dfd6cB81109a908b",
    "0x94b7310b952611662C64a0CfE123Db5664C2Ea78",
    "0x510b10C09e6440EE099d8b66D56c89A3EBaDd882",
    "0x2EDa8595AB79bB08E0B2c19750418Eaf13B5E275",
    "0x77640ec95c14a84aF8eCd6bB4439e0F0cb129601",
    "0x01c8A57fb706C859751F52FE1C83C3163b129289",
    "0xc37E7542fA5e02a834F91cc05e447EA1577FBa04",
    "0xa612C4F6d3A231c7949edEFf0e6574Fe787a918E",
    "0x53668bbe886d0da46ddd61e2182061f4131af7b2",
  ];
  for (let index = 0; index < arr.length; index++) {
    const address = arr[index];
    await strapi.services["bounty-reward"].recordReward(
      address,
      "GLD-contract-address",
      "GLD",
      "2500"
    );
    console.log(index);
  }
}
async function exportDonateFile() {
  const res = await strapi.services["donation-transaction"].find({
    _limit: -1,
  });
  console.log(res);
  const headers = [
    {
      id: "hash",
      title: "hash",
    },
    {
      id: "amountStr",
      title: "amount",
    },
    {
      id: "wallet",
      title: "wallet",
    },
    {
      id: "date",
      title: "date",
    },
    {
      id: "username",
      title: "username",
    },
    {
      id: "twittername",
      title: "twittername",
    },
  ];
  await exportDataToCsv(
    res.map((r) => ({ ...r, twittername: _.get(r, "hunter.name", "") })),
    headers,
    "donate.csv"
  );
}
const duplicateGlodaoDailyTask = async () => {
  const taskRecord = await strapi.services.task.findOne({
    name: "GloDAO",
    startTime: moment().format("YYYY-MM-DDT14:00:00.000") + "Z",
  });
  console.log(taskRecord);
};
const exportCsvStep = async () => {
  const task = await strapi.services.task.findOne({
    id: "6333fedeb9d50226298eacab",
  });
  const applies = await strapi.services.apply.find({
    task: "6333fedeb9d50226298eacab",
    _limit: -1,
  });
  console.log(task);
  console.log(applies.length);
  const apply1 = applies[0];
  console.log(apply1);
  const getStepNumber = (arr) => {
    return arr.filter((el) => el.finished === true).length;
  };
  console.log(getStepNumber(apply1.data["optional"]));
  applies.forEach((apply) => {
    // apply.step = getStepNumber(apply.data["optional"]);
    console.log(getStepNumber(apply.data["optional"]));
    // console.log(apply["data"]["optional"][9]);
    // console.log(apply["data"]["optional"][9].imageShareTime === undefined);
    console.log(apply["data"]["optional"]);
  });
  console.log(applies[0]["data"]["optional"][10]);
  const appendApi = (link) => {
    if (!link) return link;
    if (!link.includes("upload")) return link;
    return link.includes("https://") ? link : `https://api.glodao.io${link}`;
  };
  const headers = [
    {
      id: "id",
      title: "id",
    },
    {
      id: "name",
      title: "hunterName",
    },

    {
      id: "address",
      title: "walletAddress",
    },
    {
      id: "step",
      title: "Step",
    },
    {
      id: "link",
      title: "link",
    },
    {
      id: "completeTime",
      title: "completeTime",
    },
    {
      id: "feedback",
      title: "feecback",
    },
    {
      id: "imageShareTime",
      title: "imageShareTime",
    },
    {
      id: "mail",
      title: "mail",
    },
  ];

  await exportDataToCsv(
    applies.map((apply) => ({
      ...apply,
      name: apply.hunter.name,
      address: apply.hunter.address,
      step: getStepNumber(apply.data["optional"]) + " trên 11",
      link: appendApi(apply.data["optional"][9].link),
      feedback: apply.data["optional"][10].link,
      imageShareTime: apply.data["optional"][9].shareTime
        ? moment(apply.data["optional"][9].shareTime)
        : "null",
      mail: apply.data["optional"][0].link,
    })),
    headers,
    `realbox.csv`
  );
};

async function coinmap() {
  const applies = await strapi.services.apply.find({
    task: "63498397e701da536d18e5fc",
    status: "completed",
  });
  console.log(applies.length);
  const sample = applies[0];
  console.log(sample);
  let headers = [
    { id: "bounty", title: "bounty" },
    { id: "commissionRate", title: "commissionRate" },
    { id: "campaignCode", title: "campaignCode" },
    { id: "status", title: "status" },
    { id: "referrerCode", title: "referrerCode" },
    { id: "completeTime", title: "completeTime" },
    { id: "walletAddress", title: "walletAddress" },
    { id: "id", title: "id" },
    { id: "name", title: "name" },
    { id: "maxCorrect", title: "maxCorrect" },
    { id: "numOfQuiz", title: "numOfQuiz" },
  ];
  // console.log(sample.data["quiz"][0]);
  // const record = sample.data["quiz"][0].recordId;
  // const recordabc = await strapi.services["quiz-answer-record"].findOne({
  //   id: record,
  // });
  // console.log(recordabc);
  // console.log(recordabc.correctAnswerCount);
  // console.log(recordabc.history.length);
  let data = [];
  for (let index = 0; index < applies.length; index++) {
    const element = applies[index];
    const record = element.data["quiz"][0].recordId;
    const recordabc = await strapi.services["quiz-answer-record"].findOne({
      id: record,
    });
    data.push({
      ...element,
      maxCorrect: recordabc.correctAnswerCount,
      numOfQuiz: recordabc.history.length,
      name: element.hunter.name,
    });
  }

  await exportDataToCsv(data, headers, `coinmap.csv`);
}

const initAllPlatformToUserAndTask = async () => {};

const checkSabbir = async () => {
  const user = await strapi.services.hunter.findOne({
    id: "6322d319eba2990785d1eebd",
  });
  console.log(user);
};

// const updateUserPlatform = async () => {
//   const users = await strapi
//     .query("user", "users-permissions")
//     .find({ _limit: -1 });
//   console.log(users.length);
//   const chunks = _.chunk(users, 12);
//   let index = 0;
//   for (const subChunk of chunks) {
//     index = index + 1;
//     await Promise.all(
//       subChunk.map((user) => {
//         return strapi.query("user", "users-permissions").update(
//           { id: user.id },
//           {
//             platform: "gld",
//           }
//         );
//       })
//     ).then(() => {
//       console.log("batch user update completed", index);
//     });
//   }
// };

// const updateTaskPlatform = async () => {
//   const tasks = await strapi.services.task.find({ _limit: -1 });
//   console.log(tasks.length);
//   const chunks = _.chunk(tasks, 12);
//   let index = 0;
//   for (const subChunk of chunks) {
//     index = index + 1;
//     await Promise.all(
//       subChunk.map((task) => {
//         return strapi.services.task.update(
//           { id: task.id },
//           {
//             platform: "gld",
//           }
//         );
//       })
//     ).then(() => {
//       console.log("batch task update completed", index);
//     });
//   }
// };

// const updateApplyPlatform = async () => {
//   let applies = [];
//   const limit = 5000;
//   let _start = 0;
//   let index = 1;
//   do {
//     console.log(index);
//     const res = await strapi.services.apply.find({
//       _limit: limit,
//       _start,
//     });
//     applies = applies.concat(res);
//     _start += limit;
//     if (res.length < limit) break;
//     index++;
//   } while (true);
//   const chunks = _.chunk(applies, 99);
//   index = 0;
//   for (const subChunk of chunks) {
//     index = index + 1;
//     await Promise.all(
//       subChunk.map((apply) => {
//         return strapi.services.apply.update(
//           { id: apply.id },
//           {
//             platform: "gld",
//             IsCreatedOnTaskPlatform: true,
//           }
//         );
//       })
//     ).then(() => {
//       console.log("batch apply update completed", index);
//     });
//   }
// };

const checklearn = async () => {
  const ask = await strapi.services.task.findOne({
    id: "63777a6b64bbd7029012f3fd",
  });
  console.log(ask);
  const applies = await strapi.services.apply.find({
    task: "63777a6b64bbd7029012f3fd",
  });
  console.log(applies.length);
  console.log(applies.filter((applu) => applu.status === "processing").length);
  console.log(applies.filter((applu) => applu.status === "completed").length);
};

const changeAllToMap = async () => {
  const tasks = await strapi.services.task.find({
    _limit: -1,
  });
  for (let index = 0; index < tasks.length; index++) {
    const element = tasks[index];
    if (element.votingPool !== null) {
      if (element.votingPool.managementType === "individual") {
        await strapi.services.task.update(
          {
            id: element.id,
          },
          {
            managementType: "individual",
          }
        );
      } else {
        await strapi.services["voting-pool"].update(
          {
            id: element.votingPool.id,
          },
          {
            managementType: "group",
          }
        );
        await strapi.services.task.update(
          {
            id: element.id,
          },
          {
            managementType: "group",
          }
        );
      }
      console.log(element.votingPool.managementType);
    }
  }
};

async function main(argv) {
  // await merge2Csv();
  await initialize();
  // await changeAllToMap();
  // await checklearn();
  // await coinmap();
  return;
  const headersImage = [
    {
      id: "id",
      title: "id",
    },
    {
      id: "name",
      title: "name",
    },
    {
      id: "url",
      title: "url",
    },
    {
      id: "createdAt",
      title: "createdAt",
    },
  ];
  await exportDataToCsv(
    images.map((image) => ({
      ...image,
      url: appendApi(image.url),
    })),
    headersImage,
    `realbox-image.csv`
  );
  await exportCsvStep();

  // await duplicateGlodaoDailyTask();
  // const tasks = await strapi.services.task.find({
  //   _limit: -1,
  //   missionIndex_gt: 164,
  //   _sort: "missionIndex:asc",
  // });
  // console.log(tasks.length);
  // for (let index = 0; index < tasks.length; index++) {
  //   const element = tasks[index];
  //   console.log(element.missionIndex);

  //   await strapi.services.task.update(
  //     {
  //       id: element.id,
  //     },
  //     {
  //       missionIndex: element.missionIndex + 1,
  //     }
  //   );
  // }
  return;
  const alls = await strapi.services.apply.find({
    _limit: -1,
    task: "62f97f88a7b51f5f82c58993",
  });
  console.log(alls.length);
  for (let index = 0; index < alls.length; index++) {
    const element = alls[index];
    await strapi.services.apply.delete({ id: element.id });
    console.log(index);
  }
  // await updateAllBUSDToGLD();
  // const rs=await strapi.services.task.calculateAverageCommunityReward(10);
  // console.log(rs)
  // await distributeBUSD();
  // await getSomethingChore();
  return;
  const allhunter = await strapi.services.hunter.find({
    _limit: -1,
    participationStatus: "newbie",
  });
  let data = [];
  for (let index = 0; index < allhunter.length; index++) {
    const hunter = allhunter[index];
    const count = await strapi.services.apply.count({
      hunter: hunter.id,
      task_ne: "628f9e2be57ee96d97ac2b25",
      createdAt_gte: moment("2022-05-04 19:00").toISOString(),
      status_ne: "processing",
    });
    console.log(count);
    if (count > 0) data.push(hunter);
  }
  const headers = [
    {
      id: "name",
      title: "hunterName",
    },
    {
      id: "id",
      title: "hunterId",
    },
    {
      id: "twitterId",
      title: "twitterId",
    },
    {
      id: "address",
      title: "walletAddress",
    },
  ];
  await exportDataToCsv(
    data.map((hunter) => ({
      ...hunter,
      twitterId: hunter.user.twitterId,
    })),
    headers,
    `active-user-event-3.csv`
  );
  // const wallets = await csvToJson().fromFile("ref-test.csv");
  // const allhunter = await strapi.services.hunter.find({ _limit: -1 });
  // let data = [];
  // wallets.forEach((wallet) => {
  //   const filtered = _.filter(
  //     allhunter,
  //     (hunter) => hunter.address === wallet.Wallet_Address
  //   );
  //   data = data.concat(
  //     filtered.map((hunter) => ({
  //       ...hunter,
  //       refAmount: wallet.Reward_Amount,
  //       twitterId: hunter.user.twitterId,
  //     }))
  //   );
  // });
  // console.log(data);
  // const headers = [
  //   {
  //     id: "id",
  //     title: "hunterID",
  //   },
  //   {
  //     id: "name",
  //     title: "hunterName",
  //   },
  //   {
  //     id: "address",
  //     title: "walletAddress",
  //   },
  //   {
  //     id: "twitterId",
  //     title: "twitterId",
  //   },
  //   {
  //     id: "refAmount",
  //     title: "rewardAmount",
  //   },
  // ];
  // await exportDataToCsv(data, headers, `ref-with-user.csv`);
  // await merge2Csv();
  // const res = await csvToJson().fromFile("consolidate-100622-110622.csv");
  // console.log(_.uniqBy(res, "Wallet_Address").length);
}
const getAllActiveMissionCount = async () => {
  let applies = [];
  const limit = 5000;
  let _start = 0;
  let index = 1;
  do {
    console.log(index);
    const res = await strapi.services.apply.find({
      _limit: limit,
      status_ne: "processing",
      _start,
      task_ne: "628f9e2be57ee96d97ac2b25",
      createdAt_gte: moment("04-05-2022", "DD-MM-YYYY").toISOString(),
    });
    applies = applies.concat(res);
    _start += limit;
    if (res.length < limit) break;
    index++;
  } while (true);
  console.log(applies.length);

  let finalArr = [];
  const hunters = await strapi.services.hunter.find({ _limit: -1 });

  for (let index = 0; index < hunters.length; index++) {
    const hunter = hunters[index];
    console.log(hunter.name, index, hunters.length);
    const allMission = applies.filter((apply) => apply.hunter.id === hunter.id);
    const priorityCount = allMission.filter(
      (apply) => apply.hunter.id === hunter.id && apply.poolType === "priority"
    ).length;

    const allMissionCount = allMission.length;

    console.log(priorityCount, allMissionCount);
    finalArr.push({
      name: hunter.name,
      missionCount: allMissionCount,
      priorityCount,
    });
  }
  const headers = [
    {
      id: "name",
      title: "name",
    },
    {
      id: "missionCount",
      title: "missionCount",
    },
    {
      id: "priorityCount",
      title: "priorityCount",
    },
  ];
  await exportDataToCsv(
    _.orderBy(finalArr, ["missionCount", "priorityCount"], ["desc", "desc"]),
    headers,
    "temp-active.csv"
  );
};
const calculateStatistic = async () => {
  let applies = [];
  const limit = 5000;
  let _start = 0;
  let index = 1;
  do {
    console.log(index);
    const res = await strapi.services.apply.find({
      _limit: limit,
      status_ne: "processing",
      _start,
    });
    applies = applies.concat(res);
    _start += limit;
    if (res.length < limit) break;
    index++;
  } while (true);
  const huntersObj = _.uniqBy(applies, "hunter.id");
  console.log(_.size(huntersObj));
  console.log(applies.length);
  const uniqByDate = _.groupBy(
    applies.filter(
      (apply) =>
        moment().diff(moment(apply.createdAt), "days") <= 7 &&
        moment().diff(moment(apply.createdAt), "days") > 1
    ),
    (apply) => moment(apply.completeTime).format("YYYY-MM-DD")
  );
  console.log(uniqByDate);
  let total = 0;
  for (const key in uniqByDate) {
    if (Object.hasOwnProperty.call(uniqByDate, key)) {
      const element = uniqByDate[key];
      total += _.toInteger(element.length);
      console.log(element.length);
    }
  }
  console.log(_.toNumber(total));
  console.log(_.toNumber(total / 14));
  const task = await strapi.services.task.find({ _limit: -1 });
  let money = 0;
  task.forEach((t) => {
    money += _.toInteger(t.rewardAmount);
  });
  console.log(money);
  return;
};
const algoProblem = async () => {
  let arr = await csvToJson().fromFile("algo-channel-2.csv");
  const baseMape = new Map();
  arr.forEach((element) => {
    if (!baseMape.get(element["user id"]))
      baseMape.set(element["user id"], element.username);
  });
  let arr2 = await csvToJson().fromFile("algo-channel-1.csv");
  arr2.forEach((element) => {
    if (baseMape.get(element["user id"])) {
      ///
    } else {
      baseMape.set(element["user id"], `@${element.username}`);
    }
  });
  console.log(arr.length);
  console.log(_.uniqBy(arr, "user id").length);
  console.log(baseMape.size);
  const header = [
    {
      id: "username",
      title: "username",
    },
    {
      id: "user id",
      title: "user id",
    },
  ];
  let dataLast = [];
  for (const [key, value] of baseMape.entries()) {
    dataLast.push({
      "user id": key,
      username: value,
    });
  }
  console.log(dataLast.length);
  await exportDataToCsv(dataLast, header, `algo-channel-final.csv`);
};
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const initialize = async () => {
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
