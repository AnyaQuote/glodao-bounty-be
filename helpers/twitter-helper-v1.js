const request = require("request");

// Purest strategies.
const purest = require("purest")({ request });
const purestConfig = require("@purest/providers");

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
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

const getTweetData = async (statusId, accessToken, accessTokenSecret) => {
  try {
    return new Promise((resolve, reject) => {
      twitter
        .query()
        .get("statuses/show")
        .qs({ id: statusId })
        .auth(accessToken, accessTokenSecret)
        .request((err, res, body) => {
          if (err) {
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

const getUserByScreenName = async (
  screenName,
  accessToken,
  accessTokenSecret
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter
        .query()
        .get("users/show")
        .qs({ screen_name: screenName })
        .auth(accessToken, accessTokenSecret)
        .request((err, res, body) => {
          if (err) {
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

module.exports = {
  getTweetData,
  getUserByScreenName,
};
