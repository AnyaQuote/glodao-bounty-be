"use strict";

/**
 * Module dependencies.
 */

// Public node modules.
const _ = require("lodash");
const request = require("request");

// Purest strategies.
const purest = require("purest")({ request });
const purestConfig = require("@purest/providers");
const { getAbsoluteServerUrl } = require("strapi-utils");
const jwt = require("jsonwebtoken");
const { generateRandomString } = require("../../../helpers");
const axios = require("axios");

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;

const consumer_key_dev = process.env.CONSUMER_KEY_DEV;
const consumer_secret_dev = process.env.CONSUMER_SECRET_DEV;

const consumer_key_ygg = process.env.CONSUMER_KEY_YGG;
const consumer_secret_ygg = process.env.CONSUMER_SECRET_YGG;

/**
 * Connect thanks to a third-party provider.
 *
 *
 * @param {String}    provider
 * @param {String}    access_token
 *
 * @return  {*}
 */

const connect = (provider, query) => {
  console.log("fetch user");
  console.log(query);

  const access_token = query.access_token || query.code || query.oauth_token;
  const platform = query.platform;
  let referrerCode = _.get(query, "referrerCode", "######");
  // If connected from dao-voting, userType will have value of 'voting'
  const userType = _.get(query, "userType", "bounty");

  return new Promise((resolve, reject) => {
    if (!access_token) {
      return reject([null, { message: "No access_token." }]);
    }

    // Get the profile.
    getProfile(provider, query, async (err, profile) => {
      if (provider === "ygg" || provider === "yggdev") {
        console.log(query);
        if (err) {
          return reject([null, err]);
        }

        //TODO: remove this after have twitter linking option
        if (profile.email && mappedYggTwitterAccount(profile.email)) {
          const user = await existedYggTwitterAccount(profile.email);
          if (user) {
            return resolve([user, null]);
          }
        }

        try {
          const isRefExist = await strapi.plugins[
            "users-permissions"
          ].services.user.isRefExist(referrerCode);
          const referrerCampaignCount = await strapi.services.campaign.count({
            code: referrerCode,
          });
          if (!isRefExist && referrerCampaignCount === 0) {
            referrerCode = "######";
          }

          const users = await strapi.query("user", "users-permissions").find({
            email: profile.email,
          });

          const advanced = await strapi
            .store({
              environment: "",
              type: "plugin",
              name: "users-permissions",
              key: "advanced",
            })
            .get();

          const user = _.find(users, { provider: "ygg" });

          if (_.isEmpty(user) && !advanced.allow_register) {
            return resolve([
              null,
              [{ messages: [{ id: "Auth.advanced.allow_register" }] }],
              "Register action is actually not available.",
            ]);
          }

          if (!_.isEmpty(user)) {
            let updatedUser = user;

            // For existing user who only have linked hunter
            // This will check and create linked project owner
            // when the userType = voting,
            // indicates that users sign in from dao voting
            const isHunterOrProjectOwnerCreated = await strapi.plugins[
              "users-permissions"
            ].services.user.createHunterOrProjectOwner(userType, updatedUser);
            if (isHunterOrProjectOwnerCreated) {
              const formerUser = updatedUser;
              updatedUser = await strapi
                .query("user", "users-permissions")
                .findOne({ id: formerUser.id });
            }
            // ==============================================
            return resolve([updatedUser, null]);
          } else {
            // Retrieve default role.
            const defaultRole = await strapi
              .query("role", "users-permissions")
              .findOne({ type: advanced.default_role }, []);

            const params = _.assign(profile, {
              provider: "ygg",
              role: defaultRole.id,
              confirmed: true,
              referralCode: generateReferralCode(profile.username),
              referrerCode,
              platform,
            });

            const { id: userId } = await strapi
              .query("user", "users-permissions")
              .create(params);

            const afterCreatedUser = await strapi
              .query("user", "users-permissions")
              .findOne({ id: userId });

            let afterRemovePrivateDataUser = afterCreatedUser;
            delete afterRemovePrivateDataUser.accessToken;
            delete afterRemovePrivateDataUser.accessTokenSecret;
            delete afterRemovePrivateDataUser.accessTokenYgg;
            delete afterRemovePrivateDataUser.accessTokenSecretYgg;

            return resolve([afterRemovePrivateDataUser, null]);
          }
        } catch (err) {
          console.log(err);
          return reject([null, err]);
        }
      } else {
        console.log(query);
        if (err) {
          return reject([null, err]);
        }

        try {
          const isRefExist = await strapi.plugins[
            "users-permissions"
          ].services.user.isRefExist(referrerCode);
          const referrerCampaignCount = await strapi.services.campaign.count({
            code: referrerCode,
          });
          if (!isRefExist && referrerCampaignCount === 0) {
            referrerCode = "######";
          }

          const users = await strapi.query("user", "users-permissions").find({
            twitterId: profile.twitterId,
          });

          const advanced = await strapi
            .store({
              environment: "",
              type: "plugin",
              name: "users-permissions",
              key: "advanced",
            })
            .get();

          const user = _.find(users, { provider });

          if (_.isEmpty(user) && !advanced.allow_register) {
            return resolve([
              null,
              [{ messages: [{ id: "Auth.advanced.allow_register" }] }],
              "Register action is actually not available.",
            ]);
          }

          if (!_.isEmpty(user)) {
            const { accessToken, accessTokenSecret } = profile;
            if (platform === "ygg") {
              profile.accessTokenYgg = accessToken;
              profile.accessTokenSecretYgg = accessTokenSecret;
              delete profile.accessToken;
              delete profile.accessTokenSecret;
            }
            let updatedUser = user;
            // if (!_.isEqual(user.accessToken, accessToken)) {
            try {
              updatedUser = await strapi.services.hunter.updateUserToken(
                user.id,
                accessToken,
                accessTokenSecret,
                platform
              );
            } catch (error) {
              return reject([null, error]);
            }
            // }
            // For existing user who only have linked hunter
            // This will check and create linked project owner
            // when the userType = voting,
            // indicates that users sign in from dao voting
            const isHunterOrProjectOwnerCreated = await strapi.plugins[
              "users-permissions"
            ].services.user.createHunterOrProjectOwner(userType, updatedUser);
            if (isHunterOrProjectOwnerCreated) {
              const formerUser = updatedUser;
              updatedUser = await strapi
                .query("user", "users-permissions")
                .findOne({ id: formerUser.id });
            }
            // ==============================================
            return resolve([updatedUser, null]);
          } else {
            console.log(profile);
            if (platform === "ygg" || platform === "dev") {
              profile.accessTokenYgg = profile.accessToken;
              profile.accessTokenSecretYgg = profile.accessTokenSecret;
              delete profile.accessToken;
              delete profile.accessTokenSecret;
              profile.platform = "ygg";
            } else {
              profile.platform = platform;
            }
            console.log(profile);
            if (
              !_.isEmpty(_.find(users, (user) => user.provider !== provider)) &&
              advanced.unique_email
            ) {
              return resolve([
                null,
                [{ messages: [{ id: "Auth.form.error.email.taken" }] }],
                "Email is already taken.",
              ]);
            }

            // Retrieve default role.
            const defaultRole = await strapi
              .query("role", "users-permissions")
              .findOne({ type: advanced.default_role }, []);

            const params = _.assign(profile, {
              provider: provider,
              role: defaultRole.id,
              confirmed: true,
              referralCode: generateReferralCode(profile.username),
              referrerCode,
            });

            const { id: userId } = await strapi
              .query("user", "users-permissions")
              .create(params);

            const afterCreatedUser = await strapi
              .query("user", "users-permissions")
              .findOne({ id: userId });

            let afterRemovePrivateDataUser = afterCreatedUser;
            delete afterRemovePrivateDataUser.accessToken;
            delete afterRemovePrivateDataUser.accessTokenSecret;
            delete afterRemovePrivateDataUser.accessTokenYgg;
            delete afterRemovePrivateDataUser.accessTokenSecretYgg;

            return resolve([afterRemovePrivateDataUser, null]);
          }
        } catch (err) {
          console.log(err);
          return reject([null, err]);
        }
      }
    });
  });
};

/**
 * Helper to get profiles
 *
 * @param {String}   provider
 * @param {Function} callback
 */

const getProfile = async (provider, query, callback) => {
  const access_token = query.access_token || query.code || query.oauth_token;

  const grant = await strapi
    .store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
      key: "grant",
    })
    .get();

  switch (provider) {
    case "twitter": {
      console.log(query);
      let key = consumer_key;
      let secret = consumer_secret;
      if (query.platform) {
        if (query.platform === "dev") {
          key = consumer_key_dev;
          secret = consumer_secret_dev;
          console.log("dev");
        } else if (query.platform === "ygg") {
          key = consumer_key_ygg;
          secret = consumer_secret_ygg;
          console.log("ygg");
        }
      }
      const twitter = purest({
        provider: "twitter",
        config: purestConfig,
        key: key,
        secret: secret,
      });

      twitter
        .query()
        .get("account/verify_credentials")
        .auth(access_token, query.access_secret)
        .qs({ screen_name: query["raw[screen_name]"], include_email: "true" })
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.screen_name,
              email: body.email,
              avatar: body.profile_image_url,
              twitterCreatedTime: body.created_at,
              twitterId: body.id_str,
              accessToken: access_token,
              accessTokenSecret: query.access_secret,
            });
          }
        });
      break;
    }
    case "ygg": {
      axios
        .get("https://yggsea.org/api/v1/admin/account/profile", {
          headers: { Token: access_token },
        })
        .then((resp) => {
          console.log(resp.data);
          const user = resp.data.result.user;
          callback(null, {
            username: "ygg_" + (user.email || user["_id"]),
            email: user.email,
            avatar: user.avatar,
          });
        })
        .catch((err) => callback(new Error("Cannot get profile from Ygg")));
      break;
    }
    case "yggdev": {
      axios
        .get("https://dev.app.yggsea.live/api/v1/admin/account/profile", {
          headers: { Token: access_token },
        })
        .then((resp) => {
          console.log(resp.data);
          const user = resp.data.result.user;
          callback(null, {
            username: "ygg_" + (user.email || user["_id"]),
            email: user.email,
            avatar: user.avatar,
          });
        })
        .catch((err) => callback(new Error("Cannot get profile from YggDev")));
      break;
    }
    default:
      callback(new Error("Unknown provider."));
      break;
  }
};

const mappedYggTwitterAccount = (yggEmail) => {
  if (yggEmail === "hoa@yggsea.io") {
    return true;
  } else if (yggEmail === "yansen@yggsea.io") {
    return true;
  } else if (yggEmail === "sophia@yggsea.io") {
    return true;
  } else if (yggEmail === "henson@yggsea.io") {
    return true;
  } else if (yggEmail === "nhutnguyen@yggsea.io") {
    return true;
  }
  return false;
};
//TODO: remove this after have link twitter account feature
const existedYggTwitterAccount = async (yggEmail) => {
  let existedId = null;
  if (yggEmail === "hoa@yggsea.io") {
    existedId = "1258644427620278272";
  } else if (yggEmail === "yansen@yggsea.io") {
    existedId = "119953684";
  } else if (yggEmail === "sophia@yggsea.io") {
    existedId = "1468495126670749699";
  } else if (yggEmail === "henson@yggsea.io") {
    existedId = "1597530154326437890";
  } else if (yggEmail === "nhutnguyen@yggsea.io") {
    existedId = "1079012710459666434";
  }
  if (!existedId) return null;
  const user = await strapi
    .query("user", "users-permissions")
    .findOne({ twitterId: existedId });
  return user;
};

/**
 * Generate referral code by combine username and a random nonce
 * @param {string} username Username
 * @returns Referral code generated from the username
 */
const generateReferralCode = (username) => {
  return generateRandomString();
};

const buildRedirectUri = (provider = "") =>
  `${getAbsoluteServerUrl(strapi.config)}/connect/${provider}/callback`;

module.exports = {
  connect,
  buildRedirectUri,
};
