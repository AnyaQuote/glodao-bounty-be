"use strict";

const { addHunters, getHunters } = require("../../assets/hunters");

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

const getAllHunters = async () => {
  const _limit = 500;
  let _start = 0;
  let hunters = [];
  do {
    const res = await strapi.services.hunter.find({
      _limit,
      _start,
    });
    hunters = hunters.concat(res);
    _start += _limit;
    if (res.length < _limit) break;
  } while (true);
  addHunters(hunters);
};

module.exports = async () => {
  await getAllHunters();
};
