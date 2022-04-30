"use strict";
const _ = require("lodash");
const web3 = require("web3");
const {
  isSolidityAddress,
  verifySoliditySignature,
} = require("../../../helpers/wallet-helper");
const {
  getWalletStakeAmount,
} = require("../../../helpers/blockchainHelpers/farm-helper");
const { FixedNumber } = require("@ethersproject/bignumber");
const { FIXED_NUMBER } = require("../../../constants");
const moment = require("moment");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  verifySignMessage: async (ctx) => {
    const { walletAddress, signature, id, chain } = ctx.request.body;

    if (!walletAddress || !signature || !id || !chain)
      return ctx.badRequest("Invalid request body: missing fields");

    if (!_.isEqual(chain, "sol") && !isSolidityAddress(walletAddress))
      return ctx.badRequest(
        "Invalid wallet address: wallet address is not ETH chain"
      );

    const hunter = await strapi.services.hunter.findOne({
      id: id,
    });

    const isValidSignature = await verifySoliditySignature(
      walletAddress,
      signature,
      hunter.nonce
    );

    if (isValidSignature)
      return await strapi.services.hunter.updateHunterNonce(hunter);

    return ctx.badRequest("Fail to verify sign message");
  },
  updateWalletAddress: async (ctx) => {
    const { walletAddress, id } = ctx.request.body;

    const hunter = await strapi.services.hunter.findOne({
      id: id,
    });

    return await strapi.services.hunter.updateHunterWalletAddress(
      hunter,
      walletAddress
    );
  },
  checkUserStaked: async (ctx) => {
    const { poolId, address } = ctx.query;
    const isSolidityWallet = web3.utils.isAddress(address);
    if (poolId !== null && poolId !== undefined && isSolidityWallet) {
      return await getWalletStakeAmount(address, poolId);
    } else {
      return FixedNumber.from("0");
    }
  },
  getReferrals: async (ctx) => {
    const { id } = ctx.query;
    const hunter = await strapi.services.hunter.findOne({ id });
    const relatedApplies = await strapi.services.apply.find({
      referrerCode: hunter.referralCode,
      status: "awarded",
    });
    const referralMap = new Map();
    const groupByHunterId = _.groupBy(relatedApplies, "hunter.id");
    for (const key in groupByHunterId) {
      if (Object.hasOwnProperty.call(groupByHunterId, key)) {
        const element = groupByHunterId[key];
        const sumWithInitial = element.reduce(
          (prev, current) => ({
            totalEarn: prev.totalEarn.addUnsafe(
              FixedNumber.from(current.bounty).mulUnsafe(
                FixedNumber.from(current.task.tokenBasePrice)
              )
            ),
            commission: prev.commission.addUnsafe(
              FixedNumber.from(current.bounty)
                .mulUnsafe(FixedNumber.from(`${current.commissionRate}`))
                .divUnsafe(FIXED_NUMBER.HUNDRED)
                .mulUnsafe(FixedNumber.from(current.task.tokenBasePrice))
            ),
            commissionToday:
              moment().diff(moment(current.updatedAt), "hours") <= 24
                ? prev.commissionToday.addUnsafe(
                    FixedNumber.from(current.bounty)
                      .mulUnsafe(FixedNumber.from(`${current.commissionRate}`))
                      .divUnsafe(FIXED_NUMBER.HUNDRED)
                      .mulUnsafe(FixedNumber.from(current.task.tokenBasePrice))
                  )
                : prev.commissionToday,
          }),
          {
            totalEarn: FIXED_NUMBER.ZERO,
            commission: FIXED_NUMBER.ZERO,
            commissionToday: FIXED_NUMBER.ZERO,
          }
        );
        referralMap.set(key, sumWithInitial);
      }
    }

    const referrals = await strapi.services.hunter.find({
      referrerCode: hunter.referralCode,
    });

    return referrals.map((r) => {
      const val = referralMap.get(r.id);
      return {
        ...r,
        totalEarn: _.get(val, "totalEarn._value", "0"),
        commission: _.get(val, "commission._value", "0"),
        commissionToday: _.get(val, "commissionToday._value", "0"),
      };
    });
  },
};
