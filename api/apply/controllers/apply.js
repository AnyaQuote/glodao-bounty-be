"use strict";

const {
  isValidStaker,
} = require("../../../helpers/blockchainHelpers/farm-helper");
const { isNil, get, merge, isEqual, isNumber, isEmpty } = require("lodash");
const twitterHelper = require("../../../helpers/twitter-helper");
const { MIN_QUIZ_ANSWER_COUNT } = require("../../../constants");
const {
  isUserFollowChat,
  getChatFromLink,
} = require("../../../helpers/telegram-bot-helpers");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  startHuntingProcess: async (ctx) => {
    const { hunter, task } = ctx.request.body;
    try {
      return await strapi.services.apply.create({
        hunter,
        task,
        ID: `${hunter}_${task}`,
      });
    } catch (error) {
      return ctx.badRequest(error.data.errors);
    }
  },
  finishHuntingProcess: async (ctx) => {
    const { id, walletAddress } = ctx.request.body;
    const apply = await strapi.services.apply.findOne({ id });

    // if (!isEqual(walletAddress, get(apply, "hunter.address", "")))
    //   return ctx.unauthorized(
    //     "Invalid request: Wallet not matched with the pre-registered one"
    //   );

    if (!isTaskCompleted(apply.data)) return ctx.badRequest("Unfinished task");
    if (!walletAddress)
      return ctx.badRequest("Missing wallet address to earn reward");
    return await strapi.services.apply.updateApplyStateToComplete(
      id,
      get(apply, "hunter.address", "")
    );
  },
  applyForPriorityPool: async (ctx) => {
    const { walletAddress, applyId, hunterId, taskId, poolId } =
      ctx.request.body;
    const strapiServices = strapi.services;
    if (!walletAddress || !applyId || !hunterId || !taskId || isNil(poolId))
      return ctx.badRequest("Invalid request body: missing fields");

    // if (
    //   !(await strapiServices.hunter.isPreRegisteredWalletMatched(
    //     hunterId,
    //     walletAddress
    //   ))
    // )
    //   return ctx.unauthorized(
    //     "Invalid request: Wallet not matched with the pre-registered one"
    //   );

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

    const walletAddress = get(optional, "walletAddress", "");
    // if (
    //   !isEqual(type, "quiz") &&
    //   !isEqual(walletAddress, get(apply, "hunter.address", ""))
    // )
    //   return ctx.unauthorized(
    //     "Invalid request: Wallet not matched with the pre-registered one"
    //   );
    if (isEqual(type, "finish")) {
      if (!isTaskCompleted(apply.data))
        return ctx.badRequest("Unfinished task");
      if (!walletAddress)
        return ctx.badRequest("Missing wallet address to earn reward");
      return await strapi.services.apply.updateApplyStateToComplete(
        id,
        get(apply, "hunter.address", "")
      );
    }
    let res = "";
    let updatedTaskData = taskData;

    if (isEqual(type, "quiz")) {
      const quizAnswer = get(optional, "answerList", []);
      if (quizAnswer.length < MIN_QUIZ_ANSWER_COUNT)
        return ctx.badRequest("Invalid number of answers");
      const quizId = get(optional, "quizId", "");
      const quiz = await strapi.services.quiz.findOne({ id: quizId });
      // const isQuizComplete
      // if (!strapi.services.quiz.verifyQuizAnswer(quiz.answer, quizAnswer))
      // return ctx.badRequest("Wrong quiz answer");\
      let quizTaskData = [];
      const tempQuizTaskData = get(apply, ["task", "data", type], []);
      for (let index = 0; index < tempQuizTaskData.length; index++) {
        const task = tempQuizTaskData[index];
        if (task.type !== "quiz") {
          quizTaskData.push(task);
          continue;
        }
        const recordId = await strapi.services["quiz-answer-record"].findOne({
          ID: `${task.quizId}_${get(apply, "hunter.id")}`,
        });
        quizTaskData.push({
          ...task,
          finished: !isEmpty(recordId),
          recordId: recordId.id,
        });
      }
      updatedTaskData["quiz"] = quizTaskData;
    }
    if (isEqual(type, "quizRevalidate")) {
      const quizId = get(optional, "quizId", "");
      const hunterId = get(user, "hunter", "");
      updatedTaskData = get(apply, "data");
      const existedRecord = await strapi.services["quiz-answer-record"].findOne(
        {
          ID: `${quizId}_${hunterId}`,
        }
      );
      if (isEmpty(existedRecord))
        return ctx.badRequest("The quiz was not finished");
      const tempQuizTaskData = get(apply, ["task", "data", "quiz"], []);

      for (let index = 0; index < tempQuizTaskData.length; index++) {
        const element = tempQuizTaskData[index];
        if (isEqual(element.quizId, quizId) && isEqual(element.type, "quiz")) {
          updatedTaskData["quiz"][index].recordId = existedRecord.id;
          updatedTaskData["quiz"][index].finished = true;
          updatedTaskData["quiz"][index].quizId = quizId;
        }
      }
    }

    if (isEqual(type, "quizShare")) {
      const quizId = get(optional, "quizId", "");
      const hunterId = get(user, "hunter", "");
      const link = get(optional, "link", "");

      const existedRecord = await strapi.services["quiz-answer-record"].findOne(
        {
          ID: `${quizId}_${hunterId}`,
        }
      );
      if (isEmpty(existedRecord))
        return ctx.badRequest("The quiz was not finished");
      const linkErrorMsg =
        await strapi.services.apply.validateQuizRecordShareTask(
          link,
          user,
          existedRecord.id
        );

      if (linkErrorMsg) return ctx.badRequest(linkErrorMsg);

      updatedTaskData = get(apply, "data");
      const tempQuizTaskData = get(apply, ["task", "data", "quiz"], []);

      for (let index = 0; index < tempQuizTaskData.length; index++) {
        const element = tempQuizTaskData[index];
        if (isEqual(element.quizId, quizId) && isEqual(element.type, "share")) {
          updatedTaskData["quiz"][index].recordId = existedRecord.id;
          updatedTaskData["quiz"][index].link = link;
          updatedTaskData["quiz"][index].finished = true;
          updatedTaskData["quiz"][index].quizId = quizId;
        }
      }
    }

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

    if (isEqual(type, "telegram")) {
      const telegramId = get(user, "telegramId", "");
      if (isEmpty(telegramId))
        return ctx.badRequest("You had not linked your Telegram account");

      let telegramTaskData = get(taskData, [type], []);
      const mergedTelegramTask = merge(
        telegramTaskData.map((step) => {
          return {
            ...step,
            submitedId: telegramId,
          };
        }),
        get(apply, ["task", "data", type], [])
      );

      for (let index = 0; index < mergedTelegramTask.length; index++) {
        const element = mergedTelegramTask[index];
        //if element type is chat
        if (isEqual(element.type, "chat")) {
          if (index === mergedTelegramTask.length - 1 && element.finished) {
            const isUserChatted = await strapi.services[
              "telegram-message"
            ].verifyTelegramChatTask(
              getChatFromLink(element.link),
              element.submitedId
            );
            if (!isUserChatted)
              return ctx.badRequest("You have not chatted in the chat");
          } else if (
            element.finished &&
            !mergedTelegramTask[index + 1].finished
          ) {
            const isUserChatted = await strapi.services[
              "telegram-message"
            ].verifyTelegramChatTask(
              getChatFromLink(element.link),
              element.submitedId
            );
            if (!isUserChatted)
              return ctx.badRequest("You have not chatted in the chat");
          }
        } else {
          if (index === mergedTelegramTask.length - 1 && element.finished) {
            const isUserFollow = await isUserFollowChat(
              getChatFromLink(element.link),
              element.submitedId
            );
            if (!isUserFollow)
              return ctx.badRequest("Can not find user in chat");
          } else if (
            element.finished &&
            !mergedTelegramTask[index + 1].finished
          ) {
            const isUserFollow = await isUserFollowChat(
              getChatFromLink(element.link),
              element.submitedId
            );
            if (!isUserFollow)
              return ctx.badRequest("Can not find user in chat");
          }
        }
      }
    }

    if (isEqual(type, "discord")) {
      // const discordId = get(user, "discordId", "");
      // if (isEmpty(discordId))
      //   return ctx.badRequest("You had not linked your Discord account");

      let discordTaskData = get(taskData, [type], []);
      const mergedDiscordTask = merge(
        discordTaskData.map((step) => {
          return {
            ...step,
            submitedId: discordId,
          };
        }),
        get(apply, ["task", "data", type], [])
      );
      console.log(mergedDiscordTask);

      for (let index = 0; index < mergedDiscordTask.length; index++) {
        updatedTaskData[type][index].finished = true;
        continue;
        const element = mergedDiscordTask[index];
        const { guildId, submitedId } = element;
        if (index === mergedDiscordTask.length - 1 && element.finished) {
          const isExistedRecord = true;
          // const isExistedRecord = await strapi.services[
          //   "discord-server-member"
          // ].findOne({
          //   guildId,
          //   userId: submitedId,
          // });
          if (!isExistedRecord)
            return ctx.badRequest("Can not find user in the server");
        } else if (element.finished && !mergedDiscordTask[index + 1].finished) {
          const isExistedRecord = true;
          // const isExistedRecord = await strapi.services[
          //   "discord-server-member"
          // ].findOne({
          //   guildId,
          //   userId: submitedId,
          // });
          if (!isExistedRecord)
            return ctx.badRequest("Can not find user in the server");
        }
      }
    }

    if (isEqual(type, "facebook")) {
      let optionalTaskData = get(taskData, [type], []);
      const mergedOptionalTask = merge(
        optionalTaskData.map((step) => {
          return {
            ...step,
            submitedLink: step.link,
          };
        }),
        get(apply, ["task", "data", type], [])
      );
      for (let index = 0; index < mergedOptionalTask.length; index++) {
        const element = mergedOptionalTask[index];
        if (!element.finished) continue;
        updatedTaskData[type][index].finished = true;
      }
    }

    if (isEqual(type, "optional")) {
      let optionalTaskData = get(taskData, [type], []);
      const mergedOptionalTask = merge(
        optionalTaskData.map((step) => {
          return {
            ...step,
            submitedLink: step.link,
          };
        }),
        get(apply, ["task", "data", type], [])
      );
      for (let index = 0; index < mergedOptionalTask.length; index++) {
        const element = mergedOptionalTask[index];
        if (!element.finished) continue;
        const { submitedLink, requiredContent, isLinkRequired } = element;
        if (isLinkRequired) {
          if (isEmpty(submitedLink))
            return ctx.badRequest("You have not submited link");
          //check if submited link contain requiredContent
          if (!submitedLink.includes(requiredContent))
            return ctx.badRequest("Invalid link");
        }
        updatedTaskData[type][index].finished = true;
      }
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

const isTaskCompleted = (taskData) => {
  for (const key in taskData) {
    if (Object.hasOwnProperty.call(taskData, key)) {
      const taskMiniDataArr = taskData[key];
      for (let index = 0; index < taskMiniDataArr.length; index++) {
        const element = taskMiniDataArr[index];
        if (!element.finished) return false;
      }
    }
  }
  return true;
};
