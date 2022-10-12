"use strict";

const { get, isEmpty, isNull } = require("lodash");
const moment = require("moment");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const recordNewQuizAnswer = async (
  quizId,
  hunterId,
  taskId,
  answer,
  correctAnswerCount
) => {
  const recordData = await strapi.services["quiz-answer-record"].findOne({
    ID: `${quizId}_${hunterId}_${taskId}`,
  });
  if (isEmpty(recordData) || isNull(recordData)) {
    return await strapi.services["quiz-answer-record"].create({
      quiz: quizId,
      hunter: hunterId,
      ID: `${quizId}_${hunterId}_${taskId}`,
      data: answer,
      correctAnswerCount,
      history: [
        {
          date: moment(),
          correctAnswerCount,
        },
      ],
    });
  } else {
    return await strapi.services["quiz-answer-record"].update(
      { id: recordData.id },
      {
        data: answer,
        correctAnswerCount:
          recordData.correctAnswerCount > correctAnswerCount
            ? recordData.correctAnswerCount
            : correctAnswerCount,
        history: [
          ...recordData.history,
          {
            date: moment(),
            correctAnswerCount,
          },
        ],
      }
    );
  }
  // const recordData = await strapi.services["quiz-answer-record"].create({
  //   quiz: quiz.id,
  //   hunter: get(user, "hunter"),
  //   ID: `${quiz.id}_${get(user, "hunter")}_${taskId}`,
  //   data: answer,
  // });
};

module.exports = {
  recordNewQuizAnswer,
};
