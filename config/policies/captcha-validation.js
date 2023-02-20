"use strict";

const _ = require("lodash");
const { verifyCaptchaToken } = require("../../helpers/hcaptcha-helper");

module.exports = async (ctx, next) => {
  return await next();
  const captchaToken =
    _.get(ctx, "query.captchaToken", "") ||
    _.get(ctx, "request.body.captchaToken", "") ||
    _.get(ctx, "params.captchaToken", "");

  const isCaptchaValid = await verifyCaptchaToken(captchaToken);
  if (!isCaptchaValid.success)
    return ctx.badRequest("Wrong captcha validation");

  return await next();
};
