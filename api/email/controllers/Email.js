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
        subject: `[User Contact] ${email} send contact message from Cyberk landing page`,
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
        subject: `[User Contact] ${email} send contact message from G2M landing page`,
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
};
