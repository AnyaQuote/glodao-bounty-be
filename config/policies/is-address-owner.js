"use strict";

const { get } = require("lodash");

const getValueFromContext = (ctx, key) =>
  get(ctx, `query[${key}]`) ||
  get(ctx, `request.body[${key}]`) ||
  get(ctx, `params[${key}]`);

module.exports = async (ctx, next) => {
  // must be authenticated user
  if (!ctx.state.user) {
    return ctx.unauthorized();
  }
  const collection = ctx.request.route.controller;

  if (!strapi.services[collection])
    return ctx.notFound(`Collection ${collection} not found`);

  const ownerAddress = getValueFromContext(ctx, "ownerAddress");

  if (!ownerAddress)
    return ctx.badRequest("Missing address of the record for validation");

  const user = await strapi
    .query("user", "users-permissions")
    .findOne({ id: ctx.state.user.id });

  if (!user || ownerAddress !== user.projectOwner.address) {
    return ctx.forbidden(`You can not update this entry`);
  }
  return await next();
};
