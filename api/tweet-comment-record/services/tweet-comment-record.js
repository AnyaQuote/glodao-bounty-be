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
const MAX_SIMILARITY = 0.7;

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const verifyDuplicateCommentContent = async (tweetId, commentId, data) => {
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
            },
          ],
          "commentId"
        ),
      }
    );
    if (isDuplicated) return false;

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
      if (word.length >= 12) {
        console.log(word);
        return false;
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
