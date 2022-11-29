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

  const exsitedPartner = await strapi.services["partner-platform-key"].count({
    key: PARTNER_API_KEY,
  });

  if (exsitedPartner === 0) {
    return ctx.forbidden(
      "The server understands the request but you are not authorized to access this resource"
    );
  }

  return await next();
};
