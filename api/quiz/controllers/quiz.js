"use strict";

const { MIN_QUIZ_ANSWER_COUNT } = require("../../../constants");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  verify: async (ctx) => {
    const { id, answer } = ctx.request.body;
    const quiz = await strapi.services.quiz.findOne({ id: id });
    if (answer.length < MIN_QUIZ_ANSWER_COUNT)
      return ctx.badRequest("Invalid number of answers");
    return strapi.services.quiz.verifyQuizAnswer(quiz.answer, answer);
  },
};
