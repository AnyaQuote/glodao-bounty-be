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
  updateSolanaWalletAddress: async (ctx) => {
    const { solanaAddress, id } = ctx.request.body;

    const hunter = await strapi.services.hunter.findOne({
      id: id,
    });

    return await strapi.services.hunter.updateHunterSolanaWalletAddress(
      hunter,
      solanaAddress
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
    try {
      const { id } = ctx.query;
      const hunter = await strapi.services.hunter.findOne({ id });
      const relatedApplies = await strapi.services.apply.find({
        referrerCode: hunter.referralCode,
        status: "awarded",
        _limit: -1,
      });

      const referralMap = new Map();
      const groupByHunterId = _.groupBy(
        relatedApplies.map((apply) => {
          const optionalTokenReward = _.get(apply, "optionalTokenReward", []);
          let optionalTokenTotalValue = FixedNumber.from("0");
          optionalTokenReward.forEach((token) => {
            optionalTokenTotalValue = optionalTokenTotalValue.addUnsafe(
              FixedNumber.from(`${token.bounty}`).mulUnsafe(
                FixedNumber.from(`${token.tokenBasePrice}`)
              )
            );
          });
          return { ...apply, optionalTokenTotalValue };
        }),
        "hunter.id"
      );
      for (const key in groupByHunterId) {
        if (Object.hasOwnProperty.call(groupByHunterId, key)) {
          const element = groupByHunterId[key];
          // console.log(element);
          const sumWithInitial = element.reduce(
            (prev, current) => ({
              totalEarn: prev.totalEarn
                .addUnsafe(
                  FixedNumber.from(current.bounty).mulUnsafe(
                    FixedNumber.from(current.task.tokenBasePrice)
                  )
                )
                .addUnsafe(current.optionalTokenTotalValue),
              commission: prev.commission
                .addUnsafe(
                  FixedNumber.from(current.bounty)
                    .mulUnsafe(FixedNumber.from(`${current.commissionRate}`))
                    .divUnsafe(FIXED_NUMBER.HUNDRED)
                    .mulUnsafe(FixedNumber.from(current.task.tokenBasePrice))
                )
                .addUnsafe(
                  current.optionalTokenTotalValue
                    .mulUnsafe(FixedNumber.from(`${current.commissionRate}`))
                    .divUnsafe(FIXED_NUMBER.HUNDRED)
                    .mulUnsafe(FixedNumber.from(current.task.tokenBasePrice))
                ),
              commissionToday:
                moment().diff(moment(current.completeTime), "hours") <= 24
                  ? prev.commissionToday
                      .addUnsafe(
                        FixedNumber.from(current.bounty)
                          .mulUnsafe(
                            FixedNumber.from(`${current.commissionRate}`)
                          )
                          .divUnsafe(FIXED_NUMBER.HUNDRED)
                          .mulUnsafe(
                            FixedNumber.from(current.task.tokenBasePrice)
                          )
                      )
                      .addUnsafe(
                        current.optionalTokenTotalValue
                          .mulUnsafe(
                            FixedNumber.from(`${current.commissionRate}`)
                          )
                          .divUnsafe(FIXED_NUMBER.HUNDRED)
                          .mulUnsafe(
                            FixedNumber.from(current.task.tokenBasePrice)
                          )
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
        _limit: -1,
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
    } catch (error) {
      console.log(error);
    }
  },
  getActiveReferral: async (ctx) => {
    try {
      let hunters = [];
      const limit = 500;
      let _start = 0;
      do {
        const res = await strapi.services.hunter.find({
          _limit: limit,
          _start,
          referrerCode_ne: "######",
        });
        hunters = hunters.concat(res);
        _start += limit;
        if (res.length < limit) break;
      } while (true);
      return _.uniqBy(hunters, "referrerCode").length;
    } catch (error) {
      return ctx.badRequest("Bad params");
    }
  },
  verifyJwt: async (ctx) => {
    const jwt =
      _.get(ctx, "query.jwt", "") ||
      _.get(ctx, "request.body.jwt", "") ||
      _.get(ctx, "params.jwt", "");
    try {
      const jwtVerification = await strapi.plugins[
        "users-permissions"
      ].services.jwt.verify(jwt);
      return {
        status: true,
        code: 200,
        data: jwtVerification,
      };
    } catch (error) {
      console.log(error);
      return {
        status: false,
        code: 400,
        error: "Invalid token",
        data: {},
      };
    }
  },
  updateUserSessionId: async (ctx) => {
    const kycSessionId = _.get(ctx, "request.body.kycSessionId", "");
    const user = _.get(ctx, "state.user", {});
    try {
      const data = await strapi.services.hunter.updateUserKycSessionId(
        user.id,
        kycSessionId
      );
      return {
        status: true,
        code: 200,
        data,
      };
    } catch (error) {
      console.log(error);
      return {
        status: false,
        code: 400,
        error: "Can not update user kyc session id",
      };
    }
  },
  updateHunterAnswerBank: async (ctx) => {
    const answer = _.get(ctx, "request.body.answer", {});
    if (_.isEmpty(answer)) return ctx.badRequest("Missing answer");
    const user = _.get(ctx, "state.user", {});
    const hunter = await strapi.services.hunter.findOne({ id: user.hunter });
    const answerBank = _.get(hunter, "data.answerBank", []);
    const data = _.get(hunter, "data", {});
    return await strapi.services.hunter.update(
      { id: hunter.id },
      {
        data: { ...data, answerBank: answerBank.concat(answer) },
      }
    );
  },
};
