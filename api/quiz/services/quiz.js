"use strict";
const { isArrayIncluded } = require("../../../helpers");
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

module.exports = {
  verifyQuizAnswer,
};
