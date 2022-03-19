"use strict";
const twitterHelper = require("../../../helpers/twitter-helper");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called before an entry is created
     beforeUpdate(params, data) {
      const twitterStepData = data.data.twitter ?? [];
      const twitterTaskBaseData = data.task.data.twitter ?? [];

      twitterStepData.forEach((step) => {
        console.log(step.link);
        // if (step.link) console.log(isTwitterHandle(step.link));
        // console.log(twitterHelper.getTweetDataByTweetLink('https://mobile.twitter.com/CyberKDev/status/1503999125901090817'));
        const id = twitterHelper.getTweetIdFromLink(
          "https://mobile.twitter.com/CyberKDev/status/1503999125901090817"
        );
        console.log(twitterHelper.getTweetDataByTweetId(id).then(res=>{
					console.log(res.data.text);
				}));
      });
      for (let step = 0; step < twitterStepData.length; step++) {
        const currentStepObj = twitterStepData[step];
      }

      // throw strapi.errors.badRequest('Some message you want to show in the admin UI');
    },
  },
};

const validateTwitterLink = (twitterStepData, twitterTaskBaseData) => {
  for (let step = 0; step < twitterStepData.length; step++) {
    const currentStepObj = twitterStepData[step];
    if (currentStepObj.type === "follow" || !currentStepObj.finished) continue;
  }
};
