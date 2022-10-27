const request = require("request");

// Purest strategies.
const purest = require("purest")({ request });
const purestConfig = require("@purest/providers");

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;

const consumer_key_dev = process.env.CONSUMER_KEY_DEV;
const consumer_secret_dev = process.env.CONSUMER_SECRET_DEV;

const consumer_key_ygg = process.env.CONSUMER_KEY_YGG;
const consumer_secret_ygg = process.env.CONSUMER_SECRET_YGG;

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

const twitter_dev = purest({
  provider: "twitter",
  config: purestConfig,
  defaults: {
    oauth: {
      consumer_key: consumer_key_dev,
      consumer_secret: consumer_secret_dev,
    },
  },
});

const twitter_ygg = purest({
  provider: "twitter",
  config: purestConfig,
  defaults: {
    oauth: {
      consumer_key: consumer_key_ygg,
      consumer_secret: consumer_secret_ygg,
    },
  },
});

const twitter_purest = {
  gld: twitter,
  dev: twitter_dev,
  ygg: twitter_ygg,
};

const DEFAULT_PLATFORM = "gld";

const getTweetData = async (
  statusId,
  accessToken,
  accessTokenSecret,
  platform = DEFAULT_PLATFORM
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter_purest[platform]
        .query()
        .get("statuses/show")
        .qs({ id: statusId, tweet_mode: "extended" })
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
  accessTokenSecret,
  platform = DEFAULT_PLATFORM
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter_purest[platform]
        .query()
        .get("users/show")
        .qs({ screen_name: screenName })
        .auth(accessToken, accessTokenSecret)
        .request((err, res, body) => {
          if (err) {
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

const getUserByUserId = async (
  screenName,
  accessToken,
  accessTokenSecret,
  platform = DEFAULT_PLATFORM
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter_purest[platform]
        .query()
        .get("users/show")
        .qs({ user_id: screenName })
        .auth(accessToken, accessTokenSecret)
        .request((err, res, body) => {
          if (err) {
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

const getUserFollowersByScreenName = async (
  screenName,
  accessToken,
  accessTokenSecret,
  count = 200,
  cursor = -1,
  platform = DEFAULT_PLATFORM
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter_purest[platform]
        .query()
        .get("followers/list")
        .qs({ screen_name: screenName, count, cursor })
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

const getUserTimeline = async (
  user_id,
  accessToken,
  accessTokenSecret,
  count = 200,
  max_id = "",
  since_id = "",
  platform = DEFAULT_PLATFORM
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter_purest[platform]
        .query()
        .get("statuses/user_timeline")
        .qs({
          user_id,
          count,
          max_id: max_id ? max_id : undefined,
          since_id: since_id ? since_id : undefined,
        })
        .auth(accessToken, accessTokenSecret)
        .request((err, res, body) => {
          if (err) {
            console.log(err);
            return reject([null, err]);
          } else {
            return resolve(body);
          }
        });
    });
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

const getUserTimelineByScreenName = async (
  screen_name,
  accessToken,
  accessTokenSecret,
  count = 200,
  max_id = "",
  since_id = "",
  platform = DEFAULT_PLATFORM
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter_purest[platform]
        .query()
        .get("statuses/user_timeline")
        .qs({
          screen_name,
          count,
          max_id: max_id ? max_id : undefined,
          since_id: since_id ? since_id : undefined,
        })
        .auth(accessToken, accessTokenSecret)
        .request((err, res, body) => {
          if (err) {
            console.log(err);
            return reject([null, err]);
          } else {
            return resolve(body);
          }
        });
    });
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};
module.exports = {
  getTweetData,
  getUserByScreenName,
  getUserFollowersByScreenName,
  getUserTimeline,
  getUserByUserId,
  getUserTimelineByScreenName,
};
