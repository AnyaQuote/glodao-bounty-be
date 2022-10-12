"use strict";

const { MIN_QUIZ_ANSWER_COUNT } = require("../../../constants");
const { get, sampleSize, find, isEqual, ceil, isEmpty } = require("lodash");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  verify: async (ctx) => {
    const { id, answer } = ctx.request.body;
    const taskId = get(ctx, "request.body.taskId", "");
    const user = get(ctx, "state.user", {});
    const quiz = await strapi.services.quiz.findOne({ id: id });
    let size = 10;
    let passingCriteria = 1;
    if (!isEmpty(taskId)) {
      const task = await strapi.services["task"].findOne({ id: taskId });
      size = get(
        find(get(task, "data.quiz", {}), (x) => isEqual(x.quizId, id)),
        "questionsPerQuiz",
        10
      );
      passingCriteria = get(
        find(get(task, "data.quiz", {}), (x) => isEqual(x.quizId, id)),
        "passingCriteria",
        1
      );
    }
    if (answer.length < size) {
      return ctx.badRequest("Invalid number of answers");
    }
    const wrongAnswerList = strapi.services.quiz.getWrongAnswerList(
      quiz.answer,
      answer
    );
    if (wrongAnswerList.length > 0) {
      const minCorrectAnswer = ceil(passingCriteria * size);
      const correctAnswer = size - wrongAnswerList.length;
      if (correctAnswer < minCorrectAnswer)
        return {
          status: false,
          wrongAnswerList,
          newQuestion: sampleSize(quiz.data, size),
        };
    }
    // return ctx.badRequest("fucka");

    const recordData = await strapi.services[
      "quiz-answer-record"
    ].recordNewQuizAnswer(
      quiz.id,
      get(user, "hunter"),
      taskId,
      answer,
      size - wrongAnswerList.length
    );
    // const recordData = await strapi.services["quiz-answer-record"].create({
    //   quiz: quiz.id,
    //   hunter: get(user, "hunter"),
    //   ID: `${quiz.id}_${get(user, "hunter")}_${taskId}`,
    //   data: answer,
    // });

    return {
      status: true,
      wrongAnswerList,
      data: recordData,
      newQuestion: sampleSize(quiz.data, size),
    };
  },
  getQuiz: async (ctx) => {
    const { id } = ctx.params;
    const { taskId } = ctx.query;
    let size = 10;
    if (taskId) {
      const task = await strapi.services["task"].findOne({ id: taskId });
      size = get(
        find(get(task, "data.quiz", {}), (x) => isEqual(x.quizId, id)),
        "questionsPerQuiz",
        10
      );
    }
    const { description, learningInformation, name, metadata, data } =
      await strapi.services.quiz.findOne({ id: id });

    return {
      data: sampleSize(data, size),
      description,
      learningInformation,
      name,
      metadata,
      id,
    };
  },
  createQuiz: async (ctx) => {
    const quizData = ctx.request.body;
    return await strapi.services.quiz.createQuiz(ctx, quizData);
  },
  getOwnerQuiz: async (ctx) => {
    const { id } = ctx.params;
    return await strapi.services.quiz.getOwnerQuiz(ctx, id);
  },
};
