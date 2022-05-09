const crypto = require("crypto");
const _ = require("lodash");

generateRandomString = (
  length = 6,
  wishlist = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
) =>
  Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join("");

getWordsCount = (str, withoutUrl = true) => {
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

module.exports = {
  generateRandomString,
  getWordsCount,
};
