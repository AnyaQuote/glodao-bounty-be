"use strict";

const { MIN_QUIZ_ANSWER_COUNT } = require("../../../constants");
const { get } = require("lodash");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  verify: async (ctx) => {
    const { id, answer } = ctx.request.body;
    const user = get(ctx, "state.user", {});
    const quiz = await strapi.services.quiz.findOne({ id: id });
    if (answer.length < MIN_QUIZ_ANSWER_COUNT)
      return ctx.badRequest("Invalid number of answers");
    const wrongAnswerList = strapi.services.quiz.getWrongAnswerList(
      quiz.answer,
      answer
    );
    if (wrongAnswerList.length > 0)
      return {
        status: false,
        wrongAnswerList,
      };

    const recordData = await strapi.services["quiz-answer-record"].create({
      quiz: quiz.id,
      hunter: get(user, "hunter"),
      ID: `${quiz.id}_${get(user, "hunter")}`,
      data: answer,
    });

    return {
      status: true,
      wrongAnswerList,
      data: recordData,
    };
  },
};
