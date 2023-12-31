"use strict";

const _ = require("lodash");

module.exports = async (ctx, next) => {
  if (!ctx.state.user) {
    return ctx.unauthorized();
  }

  const id =
    _.get(ctx, "query.id", "") ||
    _.get(ctx, "request.body.id", "") ||
    _.get(ctx, "params.id", "");

  const task =
    _.get(ctx, "query.task", "") ||
    _.get(ctx, "request.body.task", "") ||
    _.get(ctx, "params.task", "");
  if (!_.isEmpty(task)) {
    const taskRecord = await strapi.services.task.findOne({ id: task });
    const taskParticipantLimit = _.get(taskRecord, "maxParticipants", 0);
    if (taskParticipantLimit < 1) return await next();
    else {
      const completedCount = await strapi.services.apply.count({
        status_ne: "processing",
        task: task,
      });
      if (completedCount >= taskParticipantLimit)
        return ctx.badRequest("The mission has fulled");
    }
    const uniqueSubTypeId = _.get(taskRecord, "metadata.uniqueSubTypeId", "");
    if (!_.isEmpty(uniqueSubTypeId)) {
      const hunterId = _.get(ctx, "state.user.hunter", "");
      const hunterRecord = await strapi.services.hunter.findOne({
        id: hunterId,
      });
      const uniqueTaskIds = _.get(hunterRecord, "data.uniqueTaskIds", []);
      if (uniqueTaskIds.includes(uniqueSubTypeId))
        return ctx.badRequest("You have already applied for this mission");
    }
  } else if (!_.isEmpty(id)) {
    const apply = await strapi.services.apply.findOne({ id: id });
    const taskId = _.get(apply, "task.id", "");
    if (!taskId) return ctx.conflict("Data conflict");
    const taskRecord = await strapi.services.task.findOne({
      id: taskId,
    });
    const taskParticipantLimit = _.get(taskRecord, "maxParticipants", 0);
    if (taskParticipantLimit < 1) return await next();
    else {
      const completedCount = await strapi.services.apply.count({
        status_ne: "processing",
        task: taskId,
      });
      if (completedCount >= taskParticipantLimit)
        return ctx.badRequest("The mission has fulled");
    }
  }

  return await next();
};
