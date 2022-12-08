"use strict";
const _ = require("lodash");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const EXCEEDED_MISSION_LIMIT = "You have reached missions limit";

module.exports = {
  lifecycles: {
    // Called before an entry is created
    async beforeCreate(event) {
      const type = event.type || "bounty";
      let searchType = type;
      let totalTaskCount = await strapi.services.task.count({
        type: searchType,
      });
      if (type === "active" || type === "lucky" || type === "referral") {
        searchType = "event";
        const activeCount = await strapi.services.task.count({
          type: "active",
        });
        const luckyCount = await strapi.services.task.count({
          type: "lucky",
        });
        const referralCount = await strapi.services.task.count({
          type: "referral",
        });
        totalTaskCount = activeCount + luckyCount + referralCount;
      }

      event.missionIndex = totalTaskCount + 1;
      event.type = type;
      const poolId = event.poolId;
      if (poolId) {
        const pool = await strapi.services["voting-pool"].findOne({
          id: poolId,
        });
        const numberOfCreatedMissions = await strapi.services.task.count({
          poolId,
        });
        if (numberOfCreatedMissions >= pool.totalMission) {
          throw strapi.errors.conflict(EXCEEDED_MISSION_LIMIT);
        }
      }
      event.realPlatform = event.platform;
    },

    async beforeUpdate(params, data) {
      console.log("call update task", params);
      console.log("call update task", data);
      try {
        await strapi.services["log"].create({
          data,
          error: params,
        });
      } catch (error) {
        await strapi.services["log"].create({
          data,
          error: { params, error },
        });
      }
      delete data.platform;
      delete data.realPlatform;
      // if (data && data.platform) delete data.platform;
    },

    async beforeDelete(params) {
      const { id, _id } = params;
      const taskId = id || _id;
      if (!taskId) return;
      console.log(params);
      console.log(taskId);
      const applies = await strapi.services.apply.find({
        _limit: -1,
        task: taskId,
      });
      const chunks = _.chunk(applies, 100);
      for (const subChunksOfApplies of chunks) {
        try {
          await Promise.all(
            subChunksOfApplies.map((apply) => {
              return strapi.services.apply.delete({ id: apply.id });
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
    },
  },
};
