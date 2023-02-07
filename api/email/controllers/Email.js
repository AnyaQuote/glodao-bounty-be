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
        subject: `[User Contact] ${email} send contact message from GloDAO landing page`,
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
        lname,
        email,
        project,
        contactNumber,
        description,
        interestedService,
      } = requestBody;
      await strapi.plugins["email"].services.email.send({
        from: "hello@cyberk.io",
        to: "jon_ren@cyberk.io",
        cc: "logan@cyberk.io",
        bcc: "hoangminh881997@gmail.com",
        subject: `[Cyberk] ${email} send contact message from landing page`,
        text: `
        User Contact\n

        Fullname: ${fname} ${lname}\n
        Email: ${email}\n
        Project: ${project}\n
        Contact Number: ${contactNumber || ""}\n
        Description: ${description || ""}\n
        Interested Service:${interestedService || ""}\n
        Time: ${moment()}`,
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
  contactG2m: async (ctx) => {
    try {
      let requestBody = ctx.request.body;
      if (typeof ctx.request.body === "string")
        requestBody = JSON.parse(ctx.request.body);
      const {
        fname,
        lname,
        email,
        contactNumber,
        description,
        interestedService,
      } = requestBody;
      await strapi.plugins["email"].services.email.send({
        from: "hello@cyberk.io",
        to: "jon_ren@cyberk.io",
        cc: "logan@cyberk.io",
        bcc: "hoangminh881997@gmail.com",
        subject: `[G2M] ${email} send contact message from landing page`,
        text: `
        User Contact\n

        Fullname: ${fname} ${lname}\n
        Email: ${email}\n
        Contact Number: ${contactNumber || ""}\n
        Description: ${description || ""}\n
        Interested Service: ${interestedService || ""}\n
        Time: ${moment()}`,
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

  contactCoinseeker: async (ctx) => {
    try {
      let requestBody = ctx.request.body;
      if (typeof ctx.request.body === "string")
        requestBody = JSON.parse(ctx.request.body);
      const { email } = requestBody;
      await strapi.plugins["email"].services.email.send({
        from: "hello@cyberk.io",
        // to: "anya.quote@gmail.com",
        to: "jon_ren@cyberk.io",
        cc: "logan@cyberk.io",
        bcc: "hoangminh881997@gmail.com",
        subject: `[Coinseeker] ${email} send contact message from landing page`,
        text: `
        User Contact\n
        Email: ${email}\n
        Time: ${moment()}`,
      });
      console.log("[Coinseeker] send email finished");
      return {
        status: 200,
        message: "Email cyberk sent from coinseeker successfully",
      };
    } catch (error) {
      console.log(error);
      console.log(JSON.stringify(error));
      strapi.log.debug(error);
      ctx.send({ error: "Error sending mail cyberk-coinseeker" });
    }
  },
};
