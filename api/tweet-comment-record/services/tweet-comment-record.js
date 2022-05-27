"use strict";
const { get, isEqual, findIndex, some, isEmpty, uniqBy } = require("lodash");

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
        isEqual(get(el, "text", "").trim(), text.trim()) &&
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

module.exports = {
  verifyDuplicateCommentContent,
};
