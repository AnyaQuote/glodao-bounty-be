"use strict";

const {
  isValidStaker,
} = require("../../../helpers/blockchainHelpers/farm-helper");
const { isNil, get, merge, isEqual, isNumber } = require("lodash");
const twitterHelper = require("../../../helpers/twitter-helper");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  applyForPriorityPool: async (ctx) => {
    const { walletAddress, applyId, hunterId, taskId, poolId } =
      ctx.request.body;
    const strapiServices = strapi.services;
    if (!walletAddress || !applyId || !hunterId || !taskId || isNil(poolId))
      return ctx.badRequest("Invalid request body: missing fields");

    if (
      !(await strapiServices.hunter.isPreRegisteredWalletMatched(
        hunterId,
        walletAddress
      ))
    )
      return ctx.unauthorized(
        "Invalid request: Wallet not matched with the pre-registered one"
      );

    const taskDetail = await strapi.services.task.findOne({ id: taskId });
    if (!strapi.services.task.isTaskProcessable(taskDetail))
      return ctx.conflict("Now is not the right time to do this task");

    if (
      !(await isValidStaker(
        walletAddress,
        1000,
        get(taskDetail, "tokenBasePrice", 1)
      ))
    )
      return ctx.unauthorized(
        "Invalid request: This wallet has not stake enough to participate in the priority pool"
      );

    if (await strapiServices.task.isPriorityPoolFullById(taskId))
      return ctx.conflict(
        "Fail to apply for priority pool: Priority pool full"
      );

    return await strapiServices.apply.moveApplyToPriorityPool(applyId);
  },

  updateTaskProcess: async (ctx) => {
    const { id } = ctx.params;
    const user = get(ctx, "state.user", {});
    const { taskData, type, optional } = ctx.request.body;
    const apply = await strapi.services.apply.findOne({ id });
    if (!apply) return ctx.badRequest("Invalid request id");
    if (!strapi.services.task.isTaskProcessable(apply.task))
      return ctx.conflict("Now is not the right time to do this task");
    if (isEqual(type, "finish")) {
      const walletAddress = get(optional, "walletAddress", "");
      if (!walletAddress)
        return ctx.badRequest("Missing wallet address to earn reward");
      return await strapi.services.apply.updateApplyStateToComplete(
        id,
        walletAddress
      );
    }

    let res = "";
    let updatedTaskData = taskData;
    if (isEqual(type, "twitter")) {
      let twitterTaskData = get(taskData, [type], []);
      const mergedTwitterTask = merge(
        twitterTaskData.map((step) => {
          return {
            ...step,
            submitedLink: step.link,
          };
        }),
        get(apply, ["task", "data", type], [])
      );
      res = await strapi.services.apply.validateTwitterTask(
        mergedTwitterTask,
        apply.task.createdAt,
        user
      );
      if (!res) {
        let flag = 0;
        for (let index = 0; index < mergedTwitterTask.length; index++) {
          const element = mergedTwitterTask[index];
          if (get(mergedTwitterTask[index + 1], "finished", false)) {
            flag = index;
            continue;
          }
          if (element.finished) {
            flag = index;
            continue;
          }
          if (element.type === "follow") {
            const followErrorMsg =
              await strapi.services.apply.validateFollowTwitterTask(
                element,
                user
              );
            if (followErrorMsg) break;
            twitterTaskData[index].finished = true;
            flag = index;
            continue;
          }
          break;
          if (flag < index - 1) break;
        }
      }
      updatedTaskData["twitter"] = twitterTaskData;
    }

    if (res || isNumber(res)) {
      if (isNumber(res)) {
        const resetedTask = get(taskData, [type], []).map((task, index) => {
          if (index >= res)
            return {
              ...task,
              finished: false,
              link: "",
            };
          return task;
        });
        taskData[type] = resetedTask;
        const updated = await strapi.services.apply.updateApplyTaskDataById(
          id,
          taskData
        );
        return ctx.badRequest(
          "One or more submited link was deleted or not found",
          updated
        );
      } else return ctx.badRequest(res);
    }

    return await strapi.services.apply.updateApplyTaskDataById(
      id,
      updatedTaskData
    );
  },
};
