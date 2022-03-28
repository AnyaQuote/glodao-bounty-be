"use strict";

const {
  checkUserStaked,
} = require("../../../helpers/blockchainHelpers/farm-helper");
const { isNil } = require("lodash");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  applyForPriorityPool: async (ctx) => {
    const { walletAddress, applyId, hunterId, taskId, poolId } =
      ctx.request.body;
    const strapiServices = strapi.services;
    if (!walletAddress || !applyId || !hunterId || !taskId || isNil(poolId))
      return ctx.badRequest("Invalid request body: missing fields");

    if (
      await !strapiServices.hunter.isPreRegisteredWalletMatched(
        hunterId,
        walletAddress
      )
    )
      return ctx.unauthorized(
        "Invalid request: Wallet not matched with the pre-registered one"
      );

    if (await !checkUserStaked(poolId, walletAddress))
      return ctx.unauthorized("Invalid request: This wallet has not staked");

    if (await strapiServices.task.isPriorityPoolFullById(taskId))
      return ctx.conflict(
        "Fail to apply for priority pool: Priority pool full"
      );

    return await strapiServices.apply.moveApplyToPriorityPool(applyId);
  },
};
