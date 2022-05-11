"use strict";

const _ = require("lodash");

module.exports = async (ctx, next) => {
  // must be authenticated user
  if (!ctx.state.user) {
    return ctx.unauthorized();
  }
  const collection = ctx.request.route.controller;

  if (!strapi.services[collection])
    return ctx.notFound(`Collection ${collection} not found`);

  const recordId =
    _.get(ctx, "query.id", "") ||
    _.get(ctx, "request.body.id", "") ||
    _.get(ctx, "params.id", "");

  if (!recordId)
    return ctx.badRequest("Missing id of the record for validation");

  if (_.isEqual(collection, "hunter")) {
    const [content] = await strapi.services[collection].find({
      id: recordId,
      user: ctx.state.user.id,
    });
    if (!content) {
      return ctx.forbidden(`You can not update this entry`);
    }
  } else {
    const hunter = await strapi.services.hunter.findOne({
      user: ctx.state.user.id,
    });
    const [content] = await strapi.services[collection].find({
      id: recordId,
      hunter: hunter.id,
    });
    if (!content) {
      return ctx.forbidden(`You can not update this entry`);
    }
  }

  return await next();
};
