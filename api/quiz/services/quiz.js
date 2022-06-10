"use strict";
const { isArrayIncluded, getArrDiff } = require("../../../helpers");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

/**
 * Check if submited answers is correct or not
 * @param {array} base the base array contains all answer
 * @param {array} compare submited answers
 * @returns true if all the submited answer is correct, false otherwise
 */
const verifyQuizAnswer = (base, compare) => {
  return isArrayIncluded(compare, base);
};
const getWrongAnswerList = (base, compare) => {
  return getArrDiff(compare, base);
};
/**
 * Create new quiz record
 * @param {object} quizData contain model to create quiz
 * @returns quiz with id
 */
const createQuiz = async (quizData) => {
  const { name, description, learningInformation, data, answer, metadata } =
    quizData;
  const res = await strapi.services.quiz.create({
    name,
    description,
    learningInformation,
    data: { ...data },
    answer: { ...answer },
    metadata: { ...metadata },
  });
  return res;
};
module.exports = {
  verifyQuizAnswer,
  getWrongAnswerList,
  createQuiz,
};
