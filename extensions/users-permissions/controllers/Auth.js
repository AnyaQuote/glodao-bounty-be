"use strict";

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require("crypto");
const _ = require("lodash");
const grant = require("grant-koa");
const { sanitizeEntity } = require("strapi-utils");
const { getPlatformFromContext } = require("../../../helpers/origin-helper");

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  async callback(ctx) {
    const provider = ctx.params.provider || "local";
    const params = ctx.request.body;

    ctx.params.origin = _.get(ctx, "accept.headers.origin");
    ctx.query.origin = _.get(ctx, "accept.headers.origin");

    const platform = getPlatformFromContext(ctx);
    console.log(platform);
    if (!platform || _.isEqual(platform, "unknown")) {
      return ctx.forbidden(null, "This origin is not allowed.");
    }

    ctx.query.platform = getPlatformFromContext(ctx);

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
      const user = await strapi
        .query("user", "users-permissions")
        .findOne(query);

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
      if (provider !== "ygg" || provider !== "yggdev")
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
  },

  async resetPassword(ctx) {
    const params = _.assign({}, ctx.request.body, ctx.params);

    if (
      params.password &&
      params.passwordConfirmation &&
      params.password === params.passwordConfirmation &&
      params.code
    ) {
      const user = await strapi
        .query("user", "users-permissions")
        .findOne({ resetPasswordToken: `${params.code}` });

      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.code.provide",
            message: "Incorrect code provided.",
          })
        );
      }

      const password = await strapi.plugins[
        "users-permissions"
      ].services.user.hashPassword({
        password: params.password,
      });

      // Update the user.
      await strapi
        .query("user", "users-permissions")
        .update({ id: user.id }, { resetPasswordToken: null, password });

      ctx.send({
        jwt: strapi.plugins["users-permissions"].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query("user", "users-permissions").model,
        }),
      });
    } else if (
      params.password &&
      params.passwordConfirmation &&
      params.password !== params.passwordConfirmation
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.password.matching",
          message: "Passwords do not match.",
        })
      );
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.params.provide",
          message: "Incorrect params provided.",
        })
      );
    }
  },

  async connect(ctx, next) {
    console.log("connet");
    const grantConfig = await strapi
      .store({
        environment: "",
        type: "plugin",
        name: "users-permissions",
        key: "grant",
      })
      .get();

    const [requestPath] = ctx.request.url.split("?");
    const provider = requestPath.split("/")[2];

    if (!_.get(grantConfig[provider], "enabled")) {
      return ctx.badRequest(null, "This provider is disabled.");
    }

    if (!strapi.config.server.url.startsWith("http")) {
      strapi.log.warn(
        "You are using a third party provider for login. Make sure to set an absolute url in config/server.js. More info here: https://strapi.io/documentation/developer-docs/latest/development/plugins/users-permissions.html#setting-up-the-server-url"
      );
    }

    // Ability to pass OAuth callback dynamically
    grantConfig[provider].callback =
      _.get(ctx, "query.callback") || grantConfig[provider].callback;
    grantConfig[provider].redirect_uri =
      strapi.plugins["users-permissions"].services.providers.buildRedirectUri(
        provider
      );

    return grant(grantConfig)(ctx, next);
  },
};
