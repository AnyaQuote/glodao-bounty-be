"use strict";
const moment = require("moment");
const { chunk } = require("lodash");
const _ = require("lodash");
const {
  getUserTimelineByScreenName,
  getTweetData,
} = require("../../helpers/twitter-helper-v1");
const { getTweetIdFromLink } = require("../../helpers/twitter-helper");

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#cron-tasks
 */
module.exports = {
  "0 0 * * *": {
    task: async () => {
      try {
        console.log("Daily message delete");
        let messages = [];
        const _limit = 999;
        let _start = 0;
        do {
          const res = await strapi.services["telegram-message"].find({
            createdAt_lt: moment().subtract("2", "days").toISOString(),
            _limit,
            _start,
          });
          messages = messages.concat(res);
          _start += _limit;
          if (res.length < _limit) break;
        } while (true);
        console.log(`Total message need to be deleted: ${messages.length}`);
        const chunks = chunk(messages, 10);
        for (const subMessageChunk of chunks) {
          await Promise.all(
            subMessageChunk.map((message) => {
              return strapi.services["telegram-message"].delete({
                id: message.id,
              });
            })
          ).then(() => {
            console.log("batch message delete completed");
          });
        }
      } catch (error) {
        console.log("\x1b[31m", "Wasted");
        console.log("\x1b[37m", error);
        console.log("\x1b[31m", "Wasted");
      } finally {
        console.log("End of daily message delete");
      }
    },
    options: {
      tz: "Asia/Bangkok",
    },
  },
  "50 20 * * *": {
    task: async () => {
      try {
        console.log("50 20");
        const res = await getUserTimelineByScreenName(
          "GloDAO_Official",
          "1504294069195149318-nMFOwoRUXGK39KoKNFtig1QfT8DKJB",
          "CO0dPi4gyfmLEGOOVGnwhe1oBRSCOGXClSPMCHjuYEdbi",
          1
        );
        const tweetId = res[0].id_str;
        const taskRecord = await strapi.services.task.findOne({
          name: "GloDAO",
          startTime: moment().format("YYYY-MM-DDT14:00:00.000") + "Z",
        });
        const updatedTaskData = taskRecord.data;
        for (
          let index = 0;
          index < updatedTaskData["twitter"].length;
          index++
        ) {
          const element = updatedTaskData["twitter"][index];
          const type = element.type;
          if (type === "follow") continue;
          element.embedLink = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
          element.link = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
          updatedTaskData["twitter"][index] = element;
        }
        await strapi.services.task.update(
          { id: taskRecord.id },
          {
            data: updatedTaskData,
            totalParticipants: 0,
            completedParticipants: 0,
          }
        );
      } catch (error) {
        console.log("\x1b[31m", "Wasted");
        console.log("\x1b[37m", error);
        console.log("\x1b[31m", "Wasted");
      } finally {
        console.log("End of update task twitter link");
      }
    },
    options: {
      tz: "Asia/Bangkok",
    },
  },
  "50 18 * * *": {
    task: async () => {
      try {
        console.log("50 18");
        const res = await getUserTimelineByScreenName(
          "GloDAO_Official",
          "1504294069195149318-nMFOwoRUXGK39KoKNFtig1QfT8DKJB",
          "CO0dPi4gyfmLEGOOVGnwhe1oBRSCOGXClSPMCHjuYEdbi",
          1
        );
        const tweetId = res[0].id_str;
        const taskRecord = await strapi.services.task.findOne({
          name: "GloDAO",
          startTime: moment().format("YYYY-MM-DDT12:00:00.000") + "Z",
        });
        const updatedTaskData = taskRecord.data;
        for (
          let index = 0;
          index < updatedTaskData["twitter"].length;
          index++
        ) {
          const element = updatedTaskData["twitter"][index];
          const type = element.type;
          if (type === "follow") continue;
          element.embedLink = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
          element.link = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
          updatedTaskData["twitter"][index] = element;
        }
        await strapi.services.task.update(
          { id: taskRecord.id },
          {
            data: updatedTaskData,
            totalParticipants: 0,
            completedParticipants: 0,
          }
        );
      } catch (error) {
        console.log("\x1b[31m", "Wasted");
        console.log("\x1b[37m", error);
        console.log("\x1b[31m", "Wasted");
      } finally {
        console.log("End of update task twitter link");
      }
    },
    options: {
      tz: "Asia/Bangkok",
    },
  },
  "*/33 * * * *": {
    task: async () => {
      try {
        const tasks = await strapi.services.task.find({
          name: "GloDAO",
          endTime_gte: moment().toISOString(),
        });
        for (let index = 0; index < tasks.length; index++) {
          try {
            const task = tasks[index];
            const link = task.data["twitter"][1].link;
            const statusId = getTweetIdFromLink(link);
            const res = await getTweetData(
              statusId,
              "1504294069195149318-nMFOwoRUXGK39KoKNFtig1QfT8DKJB",
              "CO0dPi4gyfmLEGOOVGnwhe1oBRSCOGXClSPMCHjuYEdbi"
            );
            const newCompleted =
              task.completedParticipants > res.favorite_count
                ? task.completedParticipants
                : res.favorite_count;
            // const newTotal = Math.floor(newCompleted * 1.1);
            const newTotal = newCompleted;
            await strapi.services.task.update(
              { id: task.id },
              {
                completedParticipants: newCompleted,
                totalParticipants: newTotal,
              }
            );
          } catch (error) {
            console.log("\x1b[37m", error);
            console.log("\x1b[37m", error[1]);
            console.log("\x1b[37m", JSON.stringify(error));
            continue;
          }
        }
        console.log(tasks.length);
      } catch (error) {
        console.log("\x1b[31m", "Wasted");
        console.log("\x1b[37m", error);
        console.log("\x1b[37m", error[1]);
        console.log("\x1b[37m", JSON.stringify(error));
        console.log("\x1b[31m", "Wasted");
      } finally {
        console.log("End of update task twitter participant");
      }
    },
    options: {
      tz: "Asia/Bangkok",
    },
  },
};
