"use strict";

const _ = require("lodash");

module.exports = async (ctx, next) => {
  // must be authenticated user
  if (!ctx.state.user) {
    return ctx.unauthorized();
  }

  const recordId =
    _.get(ctx, "query.id", "") ||
    _.get(ctx, "request.body.id", "") ||
    _.get(ctx, "params.id", "");

  if (!recordId)
    return ctx.badRequest("Missing Id of the record for validation");

  const projectOwner = await strapi.services["project-owner"].findOne({
    id: recordId,
    user: ctx.state.user.id,
  });
  if (!_.get(projectOwner, "id")) {
    return ctx.forbidden(`You can not update this entry`);
  }

  return await next();
};
