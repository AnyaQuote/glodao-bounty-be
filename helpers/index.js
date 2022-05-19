const crypto = require("crypto");
const _ = require("lodash");

const generateRandomString = (
  length = 6,
  wishlist = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
) =>
  Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join("");

const getWordsCount = (str, withoutUrl = true) => {
  return _.size(
    _.words(
      withoutUrl
        ? _.replace(
            str,
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
            ""
          )
        : str
    )
  );
};

/**
 * Check if base array includes includedIn array
 * @param {array} base the base array to compare
 * @param {array} includedIn the compare array
 * @returns {boolean} true if the base array includes all element in the includedIn array, false other wise
 */
const isArrayIncluded = (base, includedIn) => {
  return _.isEmpty(_.differenceWith(base, includedIn, _.isEqual));
};

module.exports = {
  generateRandomString,
  getWordsCount,
  isArrayIncluded,
};
