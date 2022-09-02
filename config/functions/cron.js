"use strict";
const moment = require("moment");
const { chunk } = require("lodash");
const {
  getUserTimelineByScreenName,
} = require("../../helpers/twitter-helper-v1");

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
          startTime: moment().format("YYYY-MM-DD 21:00"),
        });
        console.log(tweetId);
        console.log(taskRecord);
        const updatedTaskData = taskRecord.data;
        updatedTaskData[
          "twitter"
        ][1].embedLink = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        updatedTaskData[
          "twitter"
        ][1].link = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        updatedTaskData[
          "twitter"
        ][2].embedLink = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        updatedTaskData[
          "twitter"
        ][2].link = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        await strapi.services.task.update(
          { id: taskRecord.id },
          { data: updatedTaskData }
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
          startTime: moment().format("YYYY-MM-DD 19:00"),
        });
        const updatedTaskData = taskRecord.data;
        updatedTaskData[
          "twitter"
        ][1].embedLink = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        updatedTaskData[
          "twitter"
        ][1].link = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        updatedTaskData[
          "twitter"
        ][2].embedLink = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        updatedTaskData[
          "twitter"
        ][2].link = `https://twitter.com/GloDAO_Official/status/${tweetId}`;
        await strapi.services.task.update(
          { id: taskRecord.id },
          { data: updatedTaskData }
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
};
