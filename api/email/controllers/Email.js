"use strict";
const _ = require("lodash");
const moment = require("moment");

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  /**
   * Sends an email to the recipient in the body of the request
   */
  contact: async (ctx) => {
    try {
      let requestBody = ctx.request.body;
      if (typeof ctx.request.body === "string")
        requestBody = JSON.parse(ctx.request.body);
      const { fname, email, description } = requestBody;
      await strapi.plugins["email"].services.email.send({
        to: "hello@glodao.io",
        bcc: "glodao.dev@gmail.com",
        subject: `[User Contact] ${email} send contact message from landing page`,
        text: `User Contact send from https://glodao.io\nFullname: ${fname}\nEmail: ${email}\nMessage: ${description}\nTime: ${moment()}`,
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
  contactCyberk: async (ctx) => {
    try {
      let requestBody = ctx.request.body;
      if (typeof ctx.request.body === "string")
        requestBody = JSON.parse(ctx.request.body);
      const {
        fname,
        email,
        description,
        company,
        services,
        contactType,
        telegramId,
      } = requestBody;
      await strapi.plugins["email"].services.email.send({
        from: "hello@cyberk.io",
        to: "glodao.dev@cyberk.io",
        cc: "daoqtoan@cyberk.io",
        bcc: "hoangminh881997@gmail.com",
        subject: `[User Contact] ${email} send contact message from landing page`,
        text: `User Contact\nFullname: ${fname}\nEmail: ${email}\nMessage: ${description}\nCompany: ${company}\nService: ${services}\nContact type:${contactType}\nTelegramID:${telegramId}\nTime: ${moment()}`,
      });
      console.log("send email finished");
      return {
        status: 200,
        message: "Email cyberk sent successfully",
      };
    } catch (error) {
      console.log(error);
      console.log(JSON.stringify(error));
      strapi.log.debug(error);
      ctx.send({ error: "Error sending mail cyberk" });
    }
  },
};
