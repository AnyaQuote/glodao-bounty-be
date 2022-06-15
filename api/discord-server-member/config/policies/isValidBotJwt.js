"use strict";

const _ = require("lodash");
const DISCORD_BOT_SECRET_JWT = process.env.DISCORD_BOT_SECRET_JWT;

module.exports = async (ctx, next) => {
  const SECRET_TOKEN =
    _.get(ctx, "query.SECRET_TOKEN", "") ||
    _.get(ctx, "request.body.SECRET_TOKEN", "") ||
    _.get(ctx, "params.SECRET_TOKEN", "");

  if (!SECRET_TOKEN || !_.isEqual(DISCORD_BOT_SECRET_JWT, SECRET_TOKEN))
    return ctx.forbidden(
      "The server understands the request but you are not authorized to access this resource"
    );

  return await next();
};
