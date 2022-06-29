"use strict";
const _ = require("lodash");

/**
 * Lifecycle callbacks for the `User` model.
 */

module.exports = {
  lifecycles: {
    async afterCreate(result) {
      const newUser = result;
      const userType = "both";
      await strapi.plugins[
        "users-permissions"
      ].services.user.createHunterOrProjectOwner(userType, newUser);
    },
    async afterDelete(result) {
      if (_.get(result, "hunter.id"))
        await strapi.services.hunter.delete({ id: result.hunter.id });
      if (_.get(result, "projectOwner.id"))
        await strapi.services["project-owner"].delete({
          id: result.projectOwner.id,
        });
    },
  },
};
