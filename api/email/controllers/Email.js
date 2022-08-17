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
      console.log(ctx.request.body);
      console.log(typeof ctx.request.body);
      const { fname, email, description } = JSON.parse(ctx.request.body);
      console.log(fname, email, description);
      await strapi.plugins["email"].services.email.send({
        to: "hello@glodao.io",
        subject: "User Contact",
        text: `User Contact send from https://glodao.io\nFullname: ${fname}\nEmail: ${email}\nMessage: ${description}`,
        from: "noreply@glodao.io",
      });
      console.log("send email finished");
      return {
        status: 200,
        message: "Email sent successfully",
      };
    } catch (error) {
      console.log(error);
      strapi.log.debug(error);
      ctx.send({ error: "Error sending mail" });
    }
  },
};
