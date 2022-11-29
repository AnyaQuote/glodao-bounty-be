"use strict";

const _ = require("lodash");

module.exports = async (ctx, next) => {
  const PARTNER_API_KEY =
    _.get(ctx, "query.PARTNER_API_KEY", "") ||
    _.get(ctx, "request.body.PARTNER_API_KEY", "") ||
    _.get(ctx, "params.PARTNER_API_KEY", "");

  if (!PARTNER_API_KEY)
    return ctx.forbidden(
      "The server understands the request but you are not authorized to access this resource"
    );

  const exsitedPartner = await strapi.services["partner-platform-key"].findOne({
    key: PARTNER_API_KEY,
  });

  if (!exsitedPartner) {
    return ctx.forbidden(
      "The server understands the request but you are not authorized to access this resource"
    );
  }

  ctx.params["partnerPlatform"] = exsitedPartner.partner;

  return await next();
};
