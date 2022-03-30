"use strict";

const _ = require("lodash");
const DEFAULT_ERROR_MSG = "You can not access this resource";

module.exports = async (ctx, next) => {
  if (!ctx.state.user) {
    return ctx.unauthorized();
  }
  const user = ctx.state.user;

  const query = _.get(ctx, "query", {});
  if (_.isEmpty(query)) return ctx.unauthorized(DEFAULT_ERROR_MSG);

  for (const [key, value] of Object.entries(query)) {
    switch (key) {
      case "referrerCode":
        if (!_.isEqual(_.get(user, "referralCode", ""), value))
          return ctx.unauthorized(DEFAULT_ERROR_MSG);
        break;

      default:
        if (
          Object.hasOwnProperty.call(user, key) &&
          !_.isEqual(_.get(user, key, ""), value)
        )
          return ctx.unauthorized(DEFAULT_ERROR_MSG);
        break;
    }
  }

  return await next();
};
