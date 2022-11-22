"use strict";

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
  },
};
