const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const moment = require("moment");
const { getWordsCount } = require("./index");

const _ = require("lodash");

const argv = yargs(hideBin(process.argv)).argv;
const twitterHelperV1 = require("./twitter-helper-v1");
const twitterHelper = require("./twitter-helper");
const request = require("request");

// Purest strategies.
const purest = require("purest")({ request });
const purestConfig = require("@purest/providers");

const consumer_key = "d5XU4WNw9UJzCR0BTnpLppzd6";
const consumer_secret = "d2e4CRQzfcgznTDtYKbQLckjuwAkZvvoMNoanvPl3VX6k6n9nO";
const twitter = purest({
  provider: "twitter",
  config: purestConfig,
  defaults: {
    oauth: {
      consumer_key: consumer_key,
      consumer_secret: consumer_secret,
    },
  },
});

async function main(argv) {
  // https://twitter.com/Cyberk22/status/1524237054111977473
  const data = await getTweetData(
    "1524237054111977473",
    "1168477461585072128-z2QQFptHWssv39paxtQS6ht1wJY8tz",
    "WiZz80SUYYqIROYUq4K61iRLwHoQvg09JCFVZJ3rB9sOt"
  );
  const text = _.get(data, "text", "") || _.get(data, "full_text", "");
  console.log(text);
  console.log(text.length);
  console.log(_.size(text));
  console.log(getWordsCount(text));
  console.log(data.entities.hashtags);
}
const getTweetData = async (statusId, accessToken, accessTokenSecret) => {
  try {
    return new Promise((resolve, reject) => {
      twitter
        .query()
        .get("statuses/show")
        .qs({ id: statusId, tweet_mode: "extended" })
        .auth(accessToken, accessTokenSecret)
        .request((err, res, body) => {
          if (err) {
            console.log(res);
            console.log(accessToken, accessTokenSecret);
            console.log(err);
            return reject([null, err]);
          } else {
            return resolve(body);
          }
        });
    });
  } catch (error) {
    throw error;
  }
};
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

main(argv)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
