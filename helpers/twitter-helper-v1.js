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

const getUserByUserId = async (screenName, accessToken, accessTokenSecret) => {
  try {
    return new Promise((resolve, reject) => {
      twitter
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
  cursor = -1
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter
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
  since_id = ""
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter
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
  since_id = ""
) => {
  try {
    return new Promise((resolve, reject) => {
      twitter
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
