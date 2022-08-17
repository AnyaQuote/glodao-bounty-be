"use strict";
const _ = require("lodash");

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  /**
   * Sends an email to the recipient in the body of the request
   */
  contact: async (ctx) => {
    try {
      const { fname, email, description } = ctx.request.body;
      await strapi.plugins["email"].services.email.send({
        to: "hello@glodao.io",
        subject: "User Contact",
        text: `User Contact send from https://glodao.io\nFullname: ${fname}\nEmail: ${email}\nMessage: ${description}`,
        from: "noreply@glodao.io",
      });
      return {
        status: 200,
        message: "Email sent successfully",
      };
    } catch (error) {
      strapi.log.debug(error);
      ctx.send({ error: "Error sending mail" });
    }
  },
};