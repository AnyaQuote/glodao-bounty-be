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
      if (!event.managementType) {
        event.managementType = "group";
      }
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
      const version = event.version;
      if (event.votingPool) {
        let votingPoolId;
        if (typeof event.votingPool === "string") {
          votingPoolId = event.votingPool;
        } else if (event.votingPool.id) {
          votingPoolId = event.votingPool.id;
        }
        if (votingPoolId) {
          const pool = await strapi.services["voting-pool"].findOne({
            id: votingPoolId,
          });
          if (pool) {
            const numberOfCreatedMissions = await strapi.services.task.count({
              poolId,
            });
            if (numberOfCreatedMissions >= pool.totalMission) {
              throw strapi.errors.conflict(EXCEEDED_MISSION_LIMIT);
            }
          }
        }
      } else if (poolId && version) {
        const pool = await strapi.services["voting-pool"].findOne({
          poolId: poolId,
          version: version,
        });
        if (pool) {
          const numberOfCreatedMissions = await strapi.services.task.count({
            poolId,
          });
          if (numberOfCreatedMissions >= pool.totalMission) {
            throw strapi.errors.conflict(EXCEEDED_MISSION_LIMIT);
          }
        }
      }
      event.realPlatform = event.platform;
    },

    async afterCreate(result, data) {
      const poolId = _.get(result, "votingPool.id", "");
      const usedMission = _.get(result, "votingPool.usedMission", 0);
      if (poolId) {
        await strapi.services["voting-pool"].update(
          { id: poolId },
          {
            usedMission: usedMission + 1,
          }
        );
      }
    },

    async beforeUpdate(params, data) {
      console.log("call update task", params);
      console.log("call update task", data);
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
      if (taskId) {
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
      }
    },
  },
};
