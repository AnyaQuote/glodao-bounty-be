"use strict";

const { MIN_QUIZ_ANSWER_COUNT } = require("../../../constants");
const { get, sampleSize } = require("lodash");
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
        newQuestion: sampleSize(quiz.data, 10),
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
      newQuestion: sampleSize(quiz.data, 10),
    };
  },
  getQuiz: async (ctx) => {
    const { id } = ctx.params;
    const { description, learningInformation, name, metadata, data } =
      await strapi.services.quiz.findOne({ id: id });
    return {
      data: sampleSize(data, 10),
      description,
      learningInformation,
      name,
      metadata,
      id,
    };
  },
  createQuiz: async (ctx) => {
    const quizData = ctx.request.body;
    return await strapi.services.quiz.createQuiz(quizData);
  },
};
