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

const getArrDiff = (base, compare) => {
  return _.differenceWith(base, compare, _.isEqual);
};

const editDistance = (s1, s2) => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/**
 * Check the similarity of two string
 * @param {string} s1 first string
 * @param {string} s2 second string
 * @returns {number} similarity of two string
 */
const similarity = (s1, s2) => {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
};

module.exports = {
  generateRandomString,
  getWordsCount,
  isArrayIncluded,
  getArrDiff,
  similarity,
};
