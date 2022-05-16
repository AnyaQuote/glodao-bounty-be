"use strict";
const schema = require("./schema");
const { genrerateModel } = require("../../core/mongoGenerator");
const VotingPoolModel = genrerateModel(schema);

module.exports = {
  ...VotingPoolModel,
};
