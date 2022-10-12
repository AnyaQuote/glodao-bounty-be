"use strict";
const _ = require("lodash");
const { MIN_QUIZ_ANSWER_COUNT } = require("../../../constants");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is created
    async beforeCreate(event) {
      const { quiz, data, hunter } = event;
      const quizData = await strapi.services.quiz.findOne({ id: quiz });
      // if (data.length < MIN_QUIZ_ANSWER_COUNT)
      // throw strapi.errors.badRequest("Invalid number of answers");
      // event.id = `${quiz}_${hunter}`;
      event.data = _.values(
        _.merge(_.keyBy(quizData.data, "id"), _.keyBy(data, "id"))
      ).filter((x) => x.answer);
    },
  },
};
