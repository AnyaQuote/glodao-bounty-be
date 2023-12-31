"use strict";
const {
  get,
  isEqual,
  findIndex,
  some,
  isEmpty,
  uniqBy,
  split,
} = require("lodash");
const { similarity } = require("../../../helpers");
const MAX_SIMILARITY = 0.8;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const verifyDuplicateCommentContent = async (
  tweetId,
  commentId,
  data,
  hunter
) => {
  try {
    const text = get(data, "full_text", "") || _.get(data, "text", "");
    if (isEmpty(text)) return false;
    const res = await strapi.services["tweet-comment-record"].findOne({
      tweetId,
    });
    if (!res) {
      await strapi.services["tweet-comment-record"].create({
        tweetId,
        data: [
          {
            commentId,
            text,
            hunter,
          },
        ],
      });
      return true;
    }

    const isDuplicated = some(
      get(res, "data", []),
      (el) =>
        similarity(get(el, "text", "").trim(), text.trim()) >= MAX_SIMILARITY &&
        !isEqual(get(el, "commentId", ""), commentId)
    );
    if (isDuplicated) return false;

    await strapi.services["tweet-comment-record"].update(
      {
        id: res.id,
      },
      {
        data: uniqBy(
          [
            ...get(res, "data", []),
            {
              commentId,
              text,
              hunter,
            },
          ],
          "commentId"
        ),
      }
    );

    return true;
  } catch (error) {
    return false;
  }
};

const isTweetDataWordCorrect = (data) => {
  try {
    const text = get(data, "full_text", "") || _.get(data, "text", "");
    const splitedArr = split(text, /\s+/);
    for (let index = 0; index < splitedArr.length; index++) {
      const word = splitedArr[index];
      console.log(word);
      if (word.startsWith("@")) continue;
      if (word.length > 14) {
        console.log(word);
        if (
          word.match(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
          ) ||
          word.match(
            /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
          )
        )
          continue;
        const splitedWord = split(word, /\W+/);
        for (let wordIndex = 0; wordIndex < splitedWord.length; wordIndex++) {
          const miniWord = splitedWord[wordIndex];
          if (miniWord.length > 15) return false;
        }
      }
    }
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  verifyDuplicateCommentContent,
  isTweetDataWordCorrect,
};
