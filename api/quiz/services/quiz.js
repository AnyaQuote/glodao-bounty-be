"use strict";
const { isArrayIncluded, getArrDiff } = require("../../../helpers");
const { isEmpty } = require("lodash");
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

const NOT_AUTHORIZED = "You are not authorize to do this";

/**
 * Create quiz record with userId
 * @param {*} ctx context
 * @param {*} quizData
 * @returns
 */
const createQuiz = async (ctx, quizData) => {
  const userId = ctx.state.user.id;
  const { name, description, learningInformation, data, answer, metadata } =
    quizData;
  const res = await strapi.services.quiz.create({
    name,
    userId,
    description,
    learningInformation,
    data,
    answer,
    metadata,
  });
  return res;
};

const RECORD_NOT_FOUND = "Could not find this record";
const NOT_RECORD_OWNER = "You are not authorize to get this record";
/**
 * Check if user is the owner of this quiz and return all including answer field
 * @param {*} ctx context
 * @param {string} id quiz record's id
 */
const getOwnerQuiz = async (ctx, id) => {
  const quiz = await strapi.services.quiz.findOne({ id });

  if (isEmpty(quiz)) {
    ctx.badRequest(RECORD_NOT_FOUND);
  }

  if (ctx.state.user.id !== quiz.userId) {
    ctx.badRequest(NOT_RECORD_OWNER);
  }

  const { description, learningInformation, answer, name, metadata, data } =
    quiz;
  return {
    data,
    description,
    answer,
    learningInformation,
    name,
    metadata,
    id,
  };
};
module.exports = {
  verifyQuizAnswer,
  getWrongAnswerList,
  createQuiz,
  getOwnerQuiz,
};
