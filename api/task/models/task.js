"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called before an entry is created
    async beforeCreate(event) {
      const type = event.type || "bounty";
      let searchType = type;
      if (type === "active" || type === "lucky" || type === "referral")
        searchType = "event";
      const totalTaskCount = await strapi.services.task.count({
        type: searchType,
      });
      event.missionIndex = totalTaskCount + 1;
      event.type = type;
    },
  },
};
