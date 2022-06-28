"use strict";
const _ = require("lodash");

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
  lifecycles: {
    async afterDelete(result) {
      await strapi.services.hunter.delete({ id: result.hunter.id });
    },
  },
};
