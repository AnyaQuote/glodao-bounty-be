"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called before an entry is created
    async beforeCreate(event) {
      const totalTaskCount = await strapi.services.task.count();
      event.missionIndex = totalTaskCount + 1;
    },
  },
};
