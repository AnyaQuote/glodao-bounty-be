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
      const totalTaskCount = await strapi.services.task.count({ type: type });
      event.missionIndex = totalTaskCount + 1;
      event.type = type;
    },
  },
};
