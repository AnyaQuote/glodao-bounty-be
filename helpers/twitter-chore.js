require("dotenv").config();

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const moment = require("moment");
const { getWordsCount } = require("./index");
const csvToJson = require("csvtojson");

const _ = require("lodash");

const argv = yargs(hideBin(process.argv)).argv;
const twitterHelperV1 = require("./twitter-helper-v1");
const twitterHelper = require("./twitter-helper");
const request = require("request");

// Purest strategies.
const purest = require("purest")({ request });
const purestConfig = require("@purest/providers");
const { exportDataToCsv } = require("./csv-helper");

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
const accessTokenArr = [
  "320251069-V2eLQWdlPBsqi0KmDPav00ytaTtdELBcK5UP1JGD",
  "1113118886675660800-nl0nH00PykZvcz8iZsFjNOfjCCaFZ3",
  "1485794267536961539-SBVrFkjMySAm3A9v0l8HIi9yAA64Ku",
  "1465654975611416576-OJ47jFy5ot1Fm3RecZ9GsVr996JA88",
  "2616144612-lhzD4csuieLUCcjftKTi1rgSE6fEoJnUoS28gZw",
  "1464820736976199729-S0Cm4rMVvxjiDEDMoXvF8CkCwhMt3f",
  "1484078430442655744-ptConzVKuC8Rn0kRaBrBjBVBFZ4kId",
  "1300226373684846593-EoPMXDlzUOFr7UrG3U9wOPdI5tGLDA",
  "1397901463121055748-zqe07643Uz40gr3l5AabYJST0OPsmk",
  "1346114944295530497-2LcVPtYWtsax77cWaKOaasX2puKKqR",
  "1163307359533297664-GJTRJLTrM4Hdr8LQzoHSZzYYsqMGcF",
  "1485639985143640064-ev495u9wldTAd36NwV5PVl9zzxnX01",
  "1510119272596799488-imsyJMNFd5WdkupYmxb0a97wsrIMSR",
  "1392016484235239424-9kFCTE1P3OS3C8BfQosC1SuV4OV16j",
  "1384777277683212291-EDqsy4rscPVY46KIi04xm3U7Nkp6Jj",
  "1482286379568611328-McXKpGFKl4M2IANlsGCVMgap1SfgKo",
  "897347178254839808-bgAgrgxJY3lC2I7JGy2Rj3QVjWnwyGM",
  "4801743883-NFkKVykcrArsWDwvqGPMQSiITDXPbZcAomtVmaR",
  "934955735787511808-1XQHTAiw1gEsG6xo7xhwSIbeqy3ni5r",
  "1463165054208020480-fcO7r1oRsmNLZh2juaz7etPGvFz7mj",
  "1168477461585072128-z2QQFptHWssv39paxtQS6ht1wJY8tz",
  "944497700854046720-VeWInLcfQFW6FkgB9FJ8nCOOyDnwHwy",
];
const accessTokenSecretArr = [
  "siz9lu1ZQQlGNTFaOpJocEuhBIFKmLsi6v2ySTj9OA2X3",
  "QcxW67IZaS8qy1WY5rHiW49keyrqzzZwO4M6t3oxSvYZd",
  "Bj8uDGcjYNvCWZsOTjHmeKyo1EpT4neBsT0WwThfUQPdZ",
  "nq34fpmYr6sbnqBaGQKVPkfoBTwEy3XqCsS34LLN0CklT",
  "RQSEbr6S0MVGCGV7qsCEALkD3ZDggtGnoy6zhyB8KmF7V",
  "qsln3wFxKRjnGuilgS0yH7nfgwXMZ4Glrp0eeVrlkQNvT",
  "V8lpu4G9U9hjtHvjVczYwCmretSNCgArj6CbvlPWOCQaL",
  "RlgBMhT4RyAKduwsOCclHcW3UPNwEqI8jmgmP24NfxbRB",
  "jKFcSl37SIAfpp1fhQYvf9AvBDAzo8K3SxjIXSGzdakSM",
  "9yeUF0jFC1Ym4LjDbHEkeP74rgRr9rE4Mb55aOTeLLGCb",
  "yJ2DVA1l6QJFOIPgtFEjZzxBd6ZDd6b0kTg6AmDPTfO9h",
  "oae07KdxUjoYiLNYqIJTTeIGNxXCC7n03laNIRsxs4nhl",
  "SZjhBxsKSodyUyofmagLWQEAXtOxbpJcEvkfqMlYgNXiW",
  "1EKFs20llLy9KmU0i7qB59ghzj0h50c761KlKehTZfmUb",
  "ibu4rFtPrwyMTy7XFngPGn2OcRUS9VhuaWVsScU089XkH",
  "IHtN4lulwpOJcgQblSWSnoMIdzVCjIXJ75kxVk5qc7cpw",
  "F8gfcKZjmh0LArTuQlV16gAeRQgOySHq3P1umpM5CI8Wr",
  "lat8fGlKKXosjM2sNe7lDBsO3skSTNxsr7CgpX6oYB4FI",
  "V912ftmbaAHIkrQ69mUox1ZEqg9c09lz5fPJpOAPFaQd3",
  "3mRipTwluAc3VDgg4Sa84wzv2YmMEwvYbl6PYAusQOebJ",
  "iZz80SUYYqIROYUq4K61iRLwHoQvg09JCFVZJ3rB9sOt",
  "kTaWuHgD7Hgvj51ROVazi7vg6Y7sBeLOWH1QEipTwDfLf",
];
// FOR GOD SAKE DO NOT TOUCH THIS ONE
const fuckenProhibitedCrawl = async () => {
  try {
    let supa_index = 0;
    let token_index = 0;
    let cursor = -1;
    let users = [];
    const accessTokenArr = [
      "320251069-V2eLQWdlPBsqi0KmDPav00ytaTtdELBcK5UP1JGD",
      "1113118886675660800-nl0nH00PykZvcz8iZsFjNOfjCCaFZ3",
      "1485794267536961539-SBVrFkjMySAm3A9v0l8HIi9yAA64Ku",
      "1465654975611416576-OJ47jFy5ot1Fm3RecZ9GsVr996JA88",
      "2616144612-lhzD4csuieLUCcjftKTi1rgSE6fEoJnUoS28gZw",
      "1464820736976199729-S0Cm4rMVvxjiDEDMoXvF8CkCwhMt3f",
      "1484078430442655744-ptConzVKuC8Rn0kRaBrBjBVBFZ4kId",
      "1300226373684846593-EoPMXDlzUOFr7UrG3U9wOPdI5tGLDA",
      "1397901463121055748-zqe07643Uz40gr3l5AabYJST0OPsmk",
      "1346114944295530497-2LcVPtYWtsax77cWaKOaasX2puKKqR",
      "1163307359533297664-GJTRJLTrM4Hdr8LQzoHSZzYYsqMGcF",
      "1485639985143640064-ev495u9wldTAd36NwV5PVl9zzxnX01",
      "1510119272596799488-imsyJMNFd5WdkupYmxb0a97wsrIMSR",
      "1392016484235239424-9kFCTE1P3OS3C8BfQosC1SuV4OV16j",
      "1384777277683212291-EDqsy4rscPVY46KIi04xm3U7Nkp6Jj",
      "1482286379568611328-McXKpGFKl4M2IANlsGCVMgap1SfgKo",
      "897347178254839808-bgAgrgxJY3lC2I7JGy2Rj3QVjWnwyGM",
      "4801743883-NFkKVykcrArsWDwvqGPMQSiITDXPbZcAomtVmaR",
      "934955735787511808-1XQHTAiw1gEsG6xo7xhwSIbeqy3ni5r",
      "1463165054208020480-fcO7r1oRsmNLZh2juaz7etPGvFz7mj",
      "1168477461585072128-z2QQFptHWssv39paxtQS6ht1wJY8tz",
    ];
    const accessTokenSecretArr = [
      "siz9lu1ZQQlGNTFaOpJocEuhBIFKmLsi6v2ySTj9OA2X3",
      "QcxW67IZaS8qy1WY5rHiW49keyrqzzZwO4M6t3oxSvYZd",
      "Bj8uDGcjYNvCWZsOTjHmeKyo1EpT4neBsT0WwThfUQPdZ",
      "nq34fpmYr6sbnqBaGQKVPkfoBTwEy3XqCsS34LLN0CklT",
      "RQSEbr6S0MVGCGV7qsCEALkD3ZDggtGnoy6zhyB8KmF7V",
      "qsln3wFxKRjnGuilgS0yH7nfgwXMZ4Glrp0eeVrlkQNvT",
      "V8lpu4G9U9hjtHvjVczYwCmretSNCgArj6CbvlPWOCQaL",
      "RlgBMhT4RyAKduwsOCclHcW3UPNwEqI8jmgmP24NfxbRB",
      "jKFcSl37SIAfpp1fhQYvf9AvBDAzo8K3SxjIXSGzdakSM",
      "9yeUF0jFC1Ym4LjDbHEkeP74rgRr9rE4Mb55aOTeLLGCb",
      "yJ2DVA1l6QJFOIPgtFEjZzxBd6ZDd6b0kTg6AmDPTfO9h",
      "oae07KdxUjoYiLNYqIJTTeIGNxXCC7n03laNIRsxs4nhl",
      "SZjhBxsKSodyUyofmagLWQEAXtOxbpJcEvkfqMlYgNXiW",
      "1EKFs20llLy9KmU0i7qB59ghzj0h50c761KlKehTZfmUb",
      "ibu4rFtPrwyMTy7XFngPGn2OcRUS9VhuaWVsScU089XkH",
      "IHtN4lulwpOJcgQblSWSnoMIdzVCjIXJ75kxVk5qc7cpw",
      "F8gfcKZjmh0LArTuQlV16gAeRQgOySHq3P1umpM5CI8Wr",
      "lat8fGlKKXosjM2sNe7lDBsO3skSTNxsr7CgpX6oYB4FI",
      "V912ftmbaAHIkrQ69mUox1ZEqg9c09lz5fPJpOAPFaQd3",
      "3mRipTwluAc3VDgg4Sa84wzv2YmMEwvYbl6PYAusQOebJ",
      "iZz80SUYYqIROYUq4K61iRLwHoQvg09JCFVZJ3rB9sOt",
    ];
    do {
      const res = await twitterHelperV1.getUserFollowersByScreenName(
        "Algolaunch",
        accessTokenArr[token_index],
        accessTokenSecretArr[token_index],
        200,
        cursor
      );
      users = users.concat(res.users);
      cursor = res.next_cursor;
      supa_index++;
      console.log(users.length);
      if (supa_index % 10 === 0) {
        token_index++;
      }
    } while (cursor !== 0);
    await exportUserListToCsv(users, "algolaunch-followers-28-05.csv");
  } catch (error) {
    console.log(error[1]);
  }
};
async function getAllLikedTweetUser() {
  let users = [];
  let pagination_token = "";
  let index = 0;
  do {
    console.log(index++);
    try {
      const res = await twitterHelper.getTweetLikedUsers(
        "1527366479557328896",
        pagination_token
      );
      users = [...users, ..._.get(res, "data", [])];
      console.log(res.data.length);
      const result_count = _.get(res, "meta.result_count", 0);
      pagination_token = _.get(res, "meta.next_token", "");
      console.log(result_count);
      console.log(pagination_token);
      if (result_count < 90) break;
    } catch (error) {
      console.log(error);
      break;
    }
  } while (true);
  const headers = [
    {
      id: "id",
      title: "id",
    },
    {
      id: "username",
      title: "username",
    },
    {
      id: "created_at",
      title: "created_at",
    },
    {
      id: "verified",
      title: "verified",
    },
    {
      id: "protected",
      title: "protected",
    },
    {
      id: "url",
      title: "url",
    },
    {
      id: "followers_count",
      title: "followers_count",
    },
    {
      id: "following_count",
      title: "following_count",
    },
    {
      id: "tweet_count",
      title: "tweet_count",
    },
    {
      id: "listed_count",
      title: "listed_count",
    },
  ];

  await exportDataToCsv(
    users.map((user) => ({
      ...user,
      ...user.public_metrics,
      url: "https://twitter.com/" + user.username,
    })),
    headers,
    "algo-tweet-liked-user-1.csv"
  );
}
// async function main(argv) {
//   // https://twitter.com/Cyberk22/status/1524237054111977473
//   let since_id = "";
//   const comments = [];
//   const comments2 = [];
//   const comments3 = [];
//   let users = await csvToJson().fromFile(
//     "./algolaunch-followers-28-05-2000.csv"
//   );
//   users = users.map((user) => ({ ...user, id: user.ID_String }));
//   console.log(users);
//   let index = 0;
//   let tokenIndex = 0;
//   const commentMap = new Map();
//   for (let userIndex = 0; userIndex < users.length; userIndex++) {
//     const user = users[userIndex];
//     since_id = "";
//     console.log("change user", user.id);
//     do {
//       index++;
//       console.log(index);
//       if (index % 500 === 0) {
//         tokenIndex++;
//         if (tokenIndex >= accessTokenArr.length - 1) tokenIndex = 0;
//       }
//       const res = await twitterHelperV1.getUserTimeline(
//         user.id,
//         accessTokenArr[tokenIndex],
//         accessTokenSecretArr[tokenIndex],
//         200,
//         since_id,
//         "1526865440579911681"
//       );
//       let found_reply_flag = false;
//       console.log("res.length", res.length);
//       for (let index = 0; index < res.length; index++) {
//         const element = res[index];
//         if (element.in_reply_to_status_id_str === "1527366479557328896") {
//           console.log("reply");
//           found_reply_flag = true;
//           comments.push(element);
//           commentMap.set(user.id, element);
//           break;
//         }
//         if (element.in_reply_to_status_id_str === "1527366479557328896") {
//           console.log("reply");
//           found_reply_flag = true;
//           comments2.push(element);
//           commentMap.set(user.id, element);
//           break;
//         }
//         if (element.in_reply_to_status_id_str === "1527366479557328896") {
//           console.log("reply");
//           found_reply_flag = true;
//           comments3.push(element);
//           commentMap.set(user.id, element);
//           break;
//         }
//       }
//       if (found_reply_flag) break;
//       if (res.length < 10) break;
//       since_id = res[res.length - 1].id_str;
//     } while (true);
//   }
//   console.log(comments);
//   console.log(comments.length);
//   console.log(commentMap.size);
//   const arrs = [];
//   const headers = [
//     {
//       id: "id",
//       title: "id",
//     },
//     {
//       id: "text",
//       title: "text",
//     },
//   ];
//   // comments.forEach(comment=>{
//   //   console.log(_.replace(comment.text,/\s+/g,' '))
//   // })
//   // return
//   await exportDataToCsv(
//     comments.map((comment) => ({
//       id: comment.user.id,
//       text: _.replace(comment.text, /\s+/g, " "),
//     })),
//     headers,
//     "algolaunch-test-comment.csv"
//   );
//   await exportDataToCsv(
//     comments2.map((comment) => ({
//       id: comment.user.id,
//       text: _.replace(comment.text, /\s+/g, " "),
//     })),
//     headers,
//     "algolaunch-test-comment2.csv"
//   );
//   await exportDataToCsv(
//     comments3.map((comment) => ({
//       id: comment.user.id,
//       text: _.replace(comment.text, /\s+/g, " "),
//     })),
//     headers,
//     "algolaunch-test-comment3.csv"
//   );
// }

async function main(argv) {
  const res = await twitterHelperV1.getUserByScreenName(
    "GloDAO_Official",
    "1431470182929559552-8vV0k4yzXDd6Ki4av8vUhyh4kNAQ6b",
    "1VBSHNWr80X9XJKoX3E96UojLIYm4jFrZJxxLEme3uiKB"
  );

  console.log(res);
}

const exportUserListToCsv = async (users, file_name) => {
  const headers = [
    // {
    //   id: "id",
    //   title: "ID",
    // },
    // {
    //   id: "id_str",
    //   title: "ID_String",
    // },
    // {
    //   id: "name",
    //   title: "Twitter_Name",
    // },
    {
      id: "screen_name",
      title: "Twitter_Username",
    },
    // {
    //   id: "location",
    //   title: "Location",
    // },
    // {
    //   id: "followers_count",
    //   title: "followers_count",
    // },
    // {
    //   id: "friends_count",
    //   title: "friends_count",
    // },
    // {
    //   id: "listed_count",
    //   title: "listed_count",
    // },
    // {
    //   id: "created_at",
    //   title: "created_at",
    // },
    // {
    //   id: "favourites_count",
    //   title: "favourites_count",
    // },
    // {
    //   id: "favourites_count",
    //   title: "favourites_count",
    // },
    // {
    //   id: "verified",
    //   title: "verified",
    // },
    // {
    //   id: "statuses_count",
    //   title: "statuses_count",
    // },
  ];
  await exportDataToCsv(users, headers, file_name);
};
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
