const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const bcrypt = require("bcryptjs");
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];
const moment = require("moment");
const crypto = require("crypto");
const grant = require("grant-koa");
const Web3 = require("web3");
const {
  isSolidityAddress,
  generateRandomNonce,
  verifySoliditySignature,
} = require("../../../helpers/wallet-helper");

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const isValidSignature = (signature, publicAddress, nonce) => {
  let isValidSignature = false;
  if (isSolidityAddress(publicAddress)) {
    isValidSignature = verifySoliditySignature(publicAddress, signature, nonce);
  } else {
    // solana
  }
  return isValidSignature;
};

const updateUser = async (user, investor) => {
  const nonce = generateRandomNonce();
  return await strapi.query("user", "users-permissions").update(
    {
      id: user.id,
    },
    {
      investor: investor.id,
      metadata: { ...user.metadata, lastLogin: moment().toISOString() },
      nonce,
    }
  );
};

// auth/signin
const votingUserSignin = async (ctx) => {
  const provider = ctx.params.provider || "local";
  const { signature, publicAddress } = ctx.request.body;
  console.log("publicAddress: ", publicAddress);
  console.log("signature: ", signature);

  const store = await strapi.store({
    environment: "",
    type: "plugin",
    name: "users-permissions",
  });

  if (provider === "local") {
    if (!_.get(await store.get({ key: "grant" }), "email.enabled")) {
      return ctx.badRequest(null, "This provider is disabled.");
    }
    try {
      if (!signature || !publicAddress)
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.signiture.publicAddress.required",
            message: "Request should have signature and publicAddress",
          })
        );
      let user = await strapi.query("user", "users-permissions").findOne({
        username: publicAddress,
        provider,
      });
      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.user.not.exist",
            message: `User with public address ${publicAddress} does not exist!`,
          })
        );
      }
      if (user.blocked === true) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.blocked",
            message: "Your account has been blocked by an administrator",
          })
        );
      }
      if (
        (!user.data || !user.data.isLedger) &&
        !isValidSignature(signature, publicAddress, user.nonce)
      ) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.signIn.error",
            message: `Signature verification failed`,
          })
        );
      }
      const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      });
      ctx.send({
        jwt,
        user,
      });
    } catch (error) {
      ctx.badRequest(null, formatError(error));
    }
  } else {
    if (!_.get(await store.get({ key: "grant" }), [provider, "enabled"])) {
      return ctx.badRequest(
        null,
        formatError({
          id: "provider.disabled",
          message: "This provider is disabled.",
        })
      );
    }

    // Connect the user with the third-party provider.
    let user, error;
    try {
      [user, error] = await strapi.plugins[
        "users-permissions"
      ].services.providers.connect(provider, ctx.query);
    } catch ([user, error]) {
      return ctx.badRequest(null, error === "array" ? error[0] : error);
    }
    if (!user) {
      return ctx.badRequest(null, error === "array" ? error[0] : error);
    }
    ctx.send({
      jwt: strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      }),
      user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query("user", "users-permissions").model,
      }),
    });
  }
};

// auth/local/register
const register = async (ctx) => {
  const pluginStore = await strapi.store({
    environment: "",
    type: "plugin",
    name: "users-permissions",
  });

  const settings = await pluginStore.get({
    key: "advanced",
  });

  if (!settings.allow_register) {
    return ctx.badRequest(
      null,
      formatError({
        id: "Auth.advanced.allow_register",
        message: "Register action is currently disabled.",
      })
    );
  }

  const params = {
    ..._.omit(ctx.request.body, [
      "confirmed",
      "confirmationToken",
      "resetPasswordToken",
    ]),
    provider: "local",
  };
  if (!params.publicAddress) {
    return ctx.badRequest(
      null,
      formatError({
        id: "Auth.form.error.publicAddress.provide",
        message: "Please provide your wallet address.",
      })
    );
  }
  const role = await strapi
    .query("role", "users-permissions")
    .findOne({ type: settings.default_role }, []);

  if (!role) {
    return ctx.badRequest(
      null,
      formatError({
        id: "Auth.form.error.role.notFound",
        message: "Impossible to find the default role.",
      })
    );
  }

  let user = await strapi.query("user", "users-permissions").findOne({
    username: params.publicAddress,
  });
  if (user) {
    return ctx.badRequest(
      null,
      formatError({
        id: "Auth.form.error.publicAddress.taken",
        message: `User with wallet address ${params.publicAddress} has already existed!`,
      })
    );
  }

  try {
    let userParams = {};
    userParams.username = params.publicAddress;
    userParams.walletType = isSolidityAddress(params.publicAddress)
      ? "solidity"
      : "solana";
    userParams.nonce = generateRandomNonce();
    userParams.provider = "local";
    userParams.confirmed = true;
    userParams.role = role.id;
    userParams.userType = "voting";

    const user = await strapi
      .query("user", "users-permissions")
      .create(userParams);
    delete user.password;

    return user;
  } catch (err) {
    let adminError = null;
    if (
      _.includes(err.message, "address") ||
      _.includes(err.message, "Address")
    )
      adminError = {
        id: "Auth.form.error.walletAddress.taken",
        message: "Public address already existed",
      };
    else
      adminError = {
        id: "Auth.form.error",
        message: err,
      };
    ctx.badRequest(null, formatError(adminError));
  }
};

const callback = async (ctx) => {
  const provider = ctx.params.provider || "local";
  const params = ctx.request.body;

  const store = await strapi.store({
    environment: "",
    type: "plugin",
    name: "users-permissions",
  });

  if (provider === "local") {
    if (!_.get(await store.get({ key: "grant" }), "email.enabled")) {
      return ctx.badRequest(null, "This provider is disabled.");
    }

    // The identifier is required.
    if (!params.identifier) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.provide",
          message: "Please provide your username or your e-mail.",
        })
      );
    }

    // The password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.password.provide",
          message: "Please provide your password.",
        })
      );
    }

    const query = { provider };

    // Check if the provided identifier is an email or not.
    const isEmail = emailRegExp.test(params.identifier);

    // Set the identifier to the appropriate query field.
    if (isEmail) {
      query.email = params.identifier.toLowerCase();
    } else {
      query.username = params.identifier;
    }

    // Check if the user exists.
    const user = await strapi.query("user", "users-permissions").findOne(query);

    if (!user) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.invalid",
          message: "Identifier or password invalid.",
        })
      );
    }

    if (
      _.get(await store.get({ key: "advanced" }), "email_confirmation") &&
      user.confirmed !== true
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.confirmed",
          message: "Your account email is not confirmed",
        })
      );
    }

    if (user.blocked === true) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.blocked",
          message: "Your account has been blocked by an administrator",
        })
      );
    }

    // The user never authenticated with the `local` provider.
    if (!user.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.password.local",
          message:
            "This user never set a local password, please login with the provider used during account creation.",
        })
      );
    }

    if (!user.role || !user.role.type || user.role.type !== "admin")
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error",
          message: "You are not Admin!",
        })
      );

    const validPassword = await strapi.plugins[
      "users-permissions"
    ].services.user.validatePassword(params.password, user.password);

    if (!validPassword) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.invalid",
          message: "Identifier or password invalid.",
        })
      );
    } else {
      ctx.send({
        jwt: strapi.plugins["users-permissions"].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query("user", "users-permissions").model,
        }),
      });
    }
  } else {
    if (!_.get(await store.get({ key: "grant" }), [provider, "enabled"])) {
      return ctx.badRequest(
        null,
        formatError({
          id: "provider.disabled",
          message: "This provider is disabled.",
        })
      );
    }

    // Connect the user with the third-party provider.
    let user, error;
    try {
      [user, error] = await strapi.plugins[
        "users-permissions"
      ].services.providers.connect(provider, ctx.query);
    } catch ([user, error]) {
      return ctx.badRequest(null, error === "array" ? error[0] : error);
    }

    if (!user) {
      return ctx.badRequest(null, error === "array" ? error[0] : error);
    }

    ctx.send({
      jwt: strapi.plugins["users-permissions"].services.jwt.issue({
        id: user.id,
      }),
      user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
        model: strapi.query("user", "users-permissions").model,
      }),
    });
  }
};

module.exports = {
  votingUserSignin,
  register,
  callback,
};
