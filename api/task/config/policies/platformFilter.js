"use strict";

const _ = require("lodash");
const { getPlatformFromContext } = require("../../../../helpers/origin-helper");

module.exports = async (ctx, next) => {
  const platform = getPlatformFromContext(ctx);
  switch (platform) {
    case "ygg":
      ctx.query["platform"] = "ygg";
      break;
    case "unknown":
      return ctx.forbidden("This origin is not allowed.");

    default:
      break;
  }

  return await next();
};
