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

    async afterUpdate(result, params, data) {
      if (result.hunter) {
        await strapi.services.hunter.update(
          { id: result.hunter.id },
          { platform: result.platform }
        );
      }
      if (result.projectOwner) {
        await strapi.services["project-owner"].update(
          { id: result.projectOwner.id },
          { platform: result.platform }
        );
      }
    },
  },
};
